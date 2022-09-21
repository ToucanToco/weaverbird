from typing import TYPE_CHECKING, TypeVar

from pypika import Field, functions
from pypika.dialects import RedshiftQuery
from pypika.queries import QueryBuilder, Table
from pypika.terms import Case, CustomFunction, LiteralValue, Term

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DATE_INFO,
    DataTypeMapping,
    SQLTranslator,
    StepContext,
)
from weaverbird.backends.pypika_translator.translators.postgresql import PostgreSQLTranslator

if TYPE_CHECKING:

    from weaverbird.pipeline.steps import ConcatenateStep

Self = TypeVar("Self", bound="RedshiftTranslator")


class DateAddWithoutUnderscore(functions.Function):
    """PyPika's DateAdd is DATE_ADD, redshift wants DATEADD"""

    def __init__(self, date_part, interval, term, alias=None):
        date_part = getattr(date_part, "value", date_part)
        super().__init__("DATEADD", LiteralValue(date_part), interval, term, alias=alias)


class RedshiftTranslator(PostgreSQLTranslator):
    DIALECT = SQLDialect.REDSHIFT
    QUERY_CLS = RedshiftQuery
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="DOUBLE PRECISION",
        integer="INTEGER",
        text="TEXT",
        datetime="TIMESTAMP",
        timestamp="TIMESTAMP",
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    SUPPORT_UNPIVOT = True
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.SIMILAR_TO
    TO_DATE_OP = ToDateOp.TIMESTAMP

    @classmethod
    def _add_date(
        cls, *, date_column: Field, add_date_value: int, add_date_unit: DATE_INFO
    ) -> Term:
        add_date_func = CustomFunction("DATEADD", ["interval", "increment", "datecol"])
        return add_date_func(add_date_unit, add_date_value, date_column)

    # Redshift's CONCAT function does not support more than 2 terms, but concats can be nested. This
    # helpers allow to nest concatenations:
    # https://docs.aws.amazon.com/redshift/latest/dg/r_CONCAT.html

    def _recursive_concat(
        self, concat: functions.Concat | None, tokens: list[str]
    ) -> functions.Concat:
        if len(tokens) == 0:
            assert concat is not None
            return concat
        if concat is None:
            concat = functions.Concat(tokens[0], tokens[1])
            return self._recursive_concat(concat, tokens[2:])
        return self._recursive_concat(functions.Concat(concat, tokens[0]), tokens[1:])

    def concatenate(
        self: Self,
        *,
        builder: QueryBuilder,
        prev_step_name: str,
        columns: list[str],
        step: "ConcatenateStep",
    ) -> StepContext:
        # from step.columns = ["city", "age", "username"], step.separator = " -> "
        # create [Field("city"), " -> ", Field("age"), " -> ", Field("username")]
        the_table = Table(prev_step_name)
        tokens = [the_table[step.columns[0]]]
        for col in step.columns[1:]:
            tokens.append(step.separator)
            tokens.append(the_table[col])

        query: QueryBuilder = self.QUERY_CLS.from_(prev_step_name).select(
            *columns,
            self._recursive_concat(None, tokens).as_(step.new_column_name),
        )
        return StepContext(query, columns + [step.new_column_name])

    @classmethod
    def _date_add(cls, *, target_column: Field, duration: int, unit: str) -> Term:
        return DateAddWithoutUnderscore(date_part=unit, interval=duration, term=target_column)

    @classmethod
    def _get_date_extract_func(cls, *, date_unit: DATE_INFO, target_column: Field) -> Term:
        # We want monday as 1, sunday as 7. Redshift goes from sunday as 0 to saturday as 6
        if date_unit == "isoDayOfWeek":
            return (
                Case()
                .when(functions.Extract("dow", target_column) == 0, 7)
                .else_(functions.Extract("dow", target_column))
            )
        return super()._get_date_extract_func(date_unit=date_unit, target_column=target_column)


SQLTranslator.register(RedshiftTranslator)
