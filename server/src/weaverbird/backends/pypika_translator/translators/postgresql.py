from typing import TYPE_CHECKING

from pypika import Field, functions
from pypika.dialects import PostgreSQLQuery
from pypika.functions import Extract, Function
from pypika.terms import Interval, LiteralValue, Term

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DATE_INFO,
    DataTypeMapping,
    Self,
    SQLTranslator,
    StepContext,
)

if TYPE_CHECKING:
    from pypika.queries import QueryBuilder

    from weaverbird.pipeline.steps import DurationStep


class DateTrunc(Function):
    def __init__(self, date_format: str, field: Field, alias: str | None = None):
        super(DateTrunc, self).__init__("DATE_TRUNC", date_format, field, alias=alias)


class PostgreSQLTranslator(SQLTranslator):
    DIALECT = SQLDialect.POSTGRES
    QUERY_CLS = PostgreSQLQuery
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
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.SIMILAR_TO
    TO_DATE_OP = ToDateOp.TIMESTAMP

    @classmethod
    def _add_date(
        cls, *, date_column: Field, add_date_value: int, add_date_unit: DATE_INFO
    ) -> Term:
        return LiteralValue(f"{date_column.name} + INTERVAL '{add_date_value} {add_date_unit}'")

    def duration(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "DurationStep",
    ) -> StepContext:
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns,
            functions.Extract(
                step.duration_in, Field(step.end_date_column) - Field(step.start_date_column)
            ).as_(step.new_column_name),
        )
        return StepContext(query, columns + [step.new_column_name])

    @classmethod
    def _get_date_extract_func(cls, *, date_unit: DATE_INFO, target_column: Field) -> Term:
        if (lowered_date_unit := date_unit.lower()) in (
            "seconds",
            "minutes",
            "hour",
            "day",
            "month",
            "quarter",
            "year",
            "yearofweek",
        ):
            return Extract(lowered_date_unit.removesuffix("s"), target_column)
        elif lowered_date_unit == "dayofweek":
            return (Extract("dow", target_column) % 7) + 1
        elif lowered_date_unit == "dayofyear":
            return Extract("doy", target_column)
        elif lowered_date_unit == "isoweek":
            return Extract("week", target_column)
        elif lowered_date_unit == "week":
            return Extract("week", target_column)
        elif lowered_date_unit == "isodayofweek":
            return Extract("isodow", target_column)
        elif lowered_date_unit == "firstdayofyear":
            return DateTrunc("year", target_column)
        elif lowered_date_unit == "firstdayofmonth":
            return DateTrunc("month", target_column)
        elif lowered_date_unit == "firstdayofweek":
            # 'week' considers monday to be the first day of the week, we want sunday. Thus, we
            # shift the timestamp back and forth
            return DateTrunc("week", target_column + Interval(days=1)) - Interval(days=1)
        elif lowered_date_unit == "firstdayofquarter":
            return DateTrunc("quarter", target_column)
        elif lowered_date_unit == "firstdayofisoweek":
            return DateTrunc("week", target_column)
        elif lowered_date_unit == "previousday":
            return target_column - Interval(days=1)
        elif lowered_date_unit == "previousyear":
            return Extract("year", target_column - Interval(years=1))
        elif lowered_date_unit == "previousmonth":
            return Extract("month", target_column - Interval(months=1))
        elif lowered_date_unit == "previousweek":
            return Extract("week", target_column - Interval(weeks=1))
        elif lowered_date_unit == "previousisoweek":
            return Extract("week", target_column - Interval(weeks=1))
        elif lowered_date_unit == "previousquarter":
            return Extract("quarter", target_column - Interval(months=3))
        elif lowered_date_unit == "firstdayofpreviousyear":
            return DateTrunc("year", target_column) - Interval(years=1)
        elif lowered_date_unit == "firstdayofpreviousmonth":
            return DateTrunc("month", target_column) - Interval(months=1)
        elif lowered_date_unit == "firstdayofpreviousquarter":
            # Postgres does not support quarters in intervals
            return DateTrunc("quarter", target_column) - Interval(months=3)
        elif lowered_date_unit == "firstdayofpreviousweek":
            return (
                DateTrunc("week", target_column + Interval(days=1))
                - Interval(days=1)
                - Interval(weeks=1)
            )
        elif lowered_date_unit == "firstdayofpreviousisoweek":
            return DateTrunc("week", target_column) - Interval(weeks=1)
        return Extract(lowered_date_unit, target_column)


SQLTranslator.register(PostgreSQLTranslator)
