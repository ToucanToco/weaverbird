from datetime import datetime
from typing import TYPE_CHECKING, TypeVar

from pypika import Field, Table, functions
from pypika.dialects import MySQLQuery
from pypika.enums import Dialects
from pypika.terms import Case, Term
from pypika.utils import format_quotes

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    DateFormatMapping,
    SQLTranslator,
    StepContext,
)
from weaverbird.pipeline.steps import UnpivotStep

Self = TypeVar("Self", bound="MySQLTranslator")

if TYPE_CHECKING:
    from pypika.queries import QueryBuilder

    from weaverbird.pipeline.steps import SplitStep


class MySQLTranslator(SQLTranslator):
    DIALECT = SQLDialect.MYSQL
    QUERY_CLS = MySQLQuery
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="SIGNED",
        date="DATE",
        float="DOUBLE",
        integer="UNSIGNED",
        text="CHAR",
        datetime="DATETIME",
        timestamp="TIMESTAMP",
    )
    DATE_FORMAT_MAPPING = DateFormatMapping(
        # https://dev.mysql.com/doc/refman/8.0/en/date-and-time-functions.html#function_date-format
        day_number="%d",
        month_number="%m",
        month_short="%b",
        month_full="%M",
        year="%Y",
    )
    # Requires MySQL>=8
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = False
    FROM_DATE_OP = FromDateOp.DATE_FORMAT
    REGEXP_OP = RegexOp.REGEXP
    TO_DATE_OP = ToDateOp.STR_TO_DATE

    @classmethod
    def _build_unpivot_col(
        cls, *, step: "UnpivotStep", quote_char: str | None, secondary_quote_char: str
    ) -> str:
        value_col = format_quotes(step.value_column_name, quote_char)
        unpivot_col = format_quotes(step.unpivot_column_name, quote_char)
        in_cols = [format_quotes(col, quote_char) for col in step.unpivot]
        in_single_quote_cols = [format_quotes(col, secondary_quote_char) for col in step.unpivot]
        rows = " UNION ALL SELECT ".join(
            [f"{col}, {val}" for col, val in zip(in_cols, in_single_quote_cols)]
        )
        return f" t1 CROSS JOIN LATERAL(SELECT {rows}) AS t2({value_col}, {unpivot_col})"

    def split(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "SplitStep",
    ) -> StepContext:
        col_field: Field = Table(prev_step_name)[step.column]
        new_cols = [f"{step.column}_{i + 1}" for i in range(step.number_cols_to_keep)]

        def build_columns():
            for i in range(step.number_cols_to_keep):
                yield (
                    # We need a case, because by default, the nested SubstringIndex will return the
                    # entire string: -1 (the last part of the split) will be index 0. So we first
                    # check if the delimiter is even contained in the regex
                    Case()
                    .when(
                        # This is hacky but I couldn't figure another way. This regex ensures that
                        # the group matches at least i times (i.e., the delimiter is present at
                        # least n times). The regex is always true for i=0 so kind of unnecessary,
                        # but having another Case statement for i=0 would be hell
                        col_field.regexp(f"(({step.delimiter}).*){{{i}}}"),
                        # https://stackoverflow.com/a/32500349
                        SubstringIndex(
                            SubstringIndex(col_field, step.delimiter, i + 1), step.delimiter, -1
                        ),
                    )
                    .else_("")
                    .as_(new_cols[i])
                )

        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns, *build_columns()
        )
        return StepContext(query, columns + new_cols)

    @staticmethod
    def _cast_to_timestamp(value: str | datetime | Field | Term) -> functions.Function:
        return functions.Timestamp(value)

    @classmethod
    def _add_date(
        cls, *, target_column: Field, duration: int, unit: str, dialect: Dialects | None = None
    ) -> Term:
        return super()._add_date(
            target_column=target_column,
            duration=duration,
            unit=unit,
            dialect=dialect or Dialects.MYSQL,
        )


SQLTranslator.register(MySQLTranslator)


class SubstringIndex(functions.Function):
    def __init__(
        self, term: str | Field, delimiter: str, count: int, alias: str | None = None
    ) -> None:
        super().__init__("SUBSTRING_INDEX", term, delimiter, count, alias=alias)
