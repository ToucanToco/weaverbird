from typing import Any, Self

from pypika import functions
from pypika.dialects import QueryBuilder, SnowflakeQueryBuilder
from pypika.enums import Dialects
from pypika.queries import Query, Selectable
from pypika.terms import Field, Term
from pypika.utils import builder, format_quotes

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    DateAddWithoutUnderscore,
    DateFormatMapping,
    FromTable,
    SQLTranslator,
    StepContext,
)
from weaverbird.pipeline.steps.duration import DURATIONS_IN_SECOND, DurationStep


class SnowflakeTimestampDiff(functions.Function):
    def __init__(self, end: Field, start: Field) -> None:
        super().__init__("TIMESTAMPDIFF", "second", start, end)


class QuotedSnowflakeQueryBuilder(SnowflakeQueryBuilder):
    QUOTE_CHAR = '"'

    @builder
    def with_(self, selectable: Selectable, name: str) -> "QueryBuilder":
        return super().with_(selectable, format_quotes(name, self.QUOTE_CHAR))


class SnowflakeQuery(Query):
    @classmethod
    def _builder(cls, **kwargs: Any) -> "QuotedSnowflakeQueryBuilder":
        return QuotedSnowflakeQueryBuilder(**kwargs)


class SnowflakeTranslator(SQLTranslator):
    DIALECT = SQLDialect.SNOWFLAKE
    QUERY_CLS = SnowflakeQuery
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="DOUBLE PRECISION",
        integer="INTEGER",
        text="TEXT",
        datetime="TIMESTAMP",
        timestamp="TIMESTAMP",
    )
    DATE_FORMAT_MAPPING = DateFormatMapping(
        # https://docs.snowflake.com/en/sql-reference/data-types-datetime#date-and-time-formats
        day_number="DD",
        month_number="MM",
        month_short="MON",
        month_full="MMMM",
        year="YYYY",
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    SUPPORT_UNPIVOT = True
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.REGEXP
    TO_DATE_OP = ToDateOp.TO_TIMESTAMP_NTZ

    @classmethod
    def _add_date(cls, *, target_column: Field, duration: int, unit: str, dialect: Dialects | None = None) -> Term:
        return DateAddWithoutUnderscore(date_part=unit.removesuffix("s"), interval=duration, term=target_column)

    @classmethod
    def _interval_to_seconds(cls, value: Selectable) -> functions.Function:
        raise NotImplementedError

    def duration(
        self: Self, *, builder: "QueryBuilder", prev_step_table: FromTable, columns: list[str], step: "DurationStep"
    ) -> StepContext:
        as_seconds = SnowflakeTimestampDiff(
            self._cast_to_timestamp(prev_step_table[step.end_date_column]),
            self._cast_to_timestamp(prev_step_table[step.start_date_column]),
        )
        new_column = (as_seconds / DURATIONS_IN_SECOND[step.duration_in]).as_(step.new_column_name)
        query: QueryBuilder = prev_step_table.select(*columns, new_column)
        return StepContext(query, columns + [step.new_column_name])


SQLTranslator.register(SnowflakeTranslator)
