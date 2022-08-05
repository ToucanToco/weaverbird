from datetime import datetime
from typing import TYPE_CHECKING, TypeVar

from pypika import Field, Table, functions
from pypika.dialects import MySQLQuery
from pypika.terms import LiteralValue, Term

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DATE_INFO,
    DataTypeMapping,
    SQLTranslator,
    StepContext,
)

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
        float="DECIMAL",
        integer="UNSIGNED",
        text="CHAR",
        datetime="TIMESTAMP",
        timestamp="TIMESTAMP",
    )
    # Requires MySQL>=8
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = False
    FROM_DATE_OP = FromDateOp.DATE_FORMAT
    REGEXP_OP = RegexOp.REGEXP
    TO_DATE_OP = ToDateOp.STR_TO_DATE
    QUOTE_CHAR = '`'

    @classmethod
    def _add_date(
        cls, *, date_column: Field, add_date_value: int, add_date_unit: DATE_INFO
    ) -> Term:
        return LiteralValue(
            f"DATE_ADD({date_column.name}, INTERVAL {add_date_value} {add_date_unit})"
        )

    def split(
        self: Self,
        *,
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "SplitStep",
    ) -> StepContext:
        col_field: Field = Table(prev_step_name)[step.column]
        new_cols = [f"{step.column}_{i+1}" for i in range(step.number_cols_to_keep)]

        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns,
            *(
                # https://stackoverflow.com/a/32500349
                SubstringIndex(
                    SubstringIndex(col_field, step.delimiter, i + 1), step.delimiter, -1
                ).as_(new_cols[i])
                for i in range(step.number_cols_to_keep)
            ),
        )
        return StepContext(query, columns + new_cols)

    @staticmethod
    def _cast_to_timestamp(value: str | datetime | Field | Term) -> functions.Function:
        return functions.Timestamp(value)

    @classmethod
    def _get_date_extract_func(cls, *, date_unit: DATE_INFO, target_column: Field) -> Term:
        if date_unit.lower() in [
            "seconds",
            "minutes",
            "hour",
            "day",
            "dayofweekiso",
            "week",
            "weekiso",
            "month",
            "milliseconds",
            "quarter",
            "year",
            "yearofweek",
            "yearofweekiso",
        ]:
            return LiteralValue(
                f"EXTRACT({date_unit[:-1] if date_unit in ['seconds', 'minutes'] else date_unit} "
                f"from {target_column.name})"
            )
        else:
            date_func: dict[DATE_INFO, str] = {
                # Returning numbers
                # -----------------
                "dayOfYear": "EXTRACT('doy' from ____target____)",
                "isoDayOfWeek": "EXTRACT('isodow' FROM ____target____)",
                "isoWeek": "EXTRACT('week' FROM ____target____)",
                "isoYear": "EXTRACT('isoyear' FROM ____target____)",
                # same problem as 'week' behaviour
                "previousWeek": "EXTRACT('week' FROM ____target____ - interval '1 week')",
                "previousIsoWeek": "EXTRACT('week' FROM ____target____ - interval '1 week')",
                "previousMonth": "EXTRACT('month' FROM ____target____ - interval '1 month')",
                "previousQuarter": "EXTRACT('quarter' FROM ____target____ - interval '3 month')",
                "previousYear": "EXTRACT('year' FROM ____target____ - interval '1 year')",
                "dayOfWeek": "MOD(EXTRACT('isodow' FROM ____target____), 7) + 1",
                # Returning dates
                # ---------------
                "previousDay": "DATE_TRUNC('day', ____target____ - interval '1 day')",
                "firstDayOfWeek": "DATE_TRUNC('day', ____target____ -(CAST(MOD(EXTRACT('isodow' from ____target____), 7) || ' days' as Interval) + interval '1 day')+ interval '1 day')",
                "firstDayOfIsoWeek": "DATE_TRUNC('week', ____target____)",
                "firstDayOfMonth": "DATE_TRUNC('month', ____target____)",
                "firstDayOfQuarter": "DATE_TRUNC('quarter', ____target____)",
                "firstDayOfYear": "DATE_TRUNC('year', ____target____)",
                "firstDayOfPreviousWeek": "DATE_TRUNC('day', ____target____ -(CAST(MOD(EXTRACT('isodow' from ____target____), 7) || ' days' as Interval) + interval '1 day')+ interval '1 day') - interval '1 week'",
                "firstDayOfPreviousIsoWeek": "DATE_TRUNC('week', ____target____ - interval '1 week')",
                "firstDayOfPreviousMonth": "DATE_TRUNC('month', ____target____) - interval '1 month'",
                "firstDayOfPreviousQuarter": "DATE_TRUNC('quarter', ____target____) - interval '3 months'",
                "firstDayOfPreviousYear": "DATE_TRUNC('year', ____target____) - interval '1 year'",
            }
            return LiteralValue(
                f'{date_func[date_unit].replace("____target____", target_column.name)}'
            )


SQLTranslator.register(MySQLTranslator)


class SubstringIndex(functions.Function):  # type: ignore[misc]
    def __init__(
        self, term: str | Field, delimiter: str, count: int, alias: str | None = None
    ) -> None:
        super().__init__("SUBSTRING_INDEX", term, delimiter, count, alias=alias)
