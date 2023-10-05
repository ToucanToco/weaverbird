from typing import Any, TypeVar

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
    SQLTranslator,
)

Self = TypeVar("Self", bound="SQLTranslator")


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
        month_full="MON",
        year="YYYY",
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    SUPPORT_UNPIVOT = True
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.REGEXP
    TO_DATE_OP = ToDateOp.TO_TIMESTAMP_NTZ

    @classmethod
    def _add_date(
        cls, *, target_column: Field, duration: int, unit: str, dialect: Dialects | None = None
    ) -> Term:
        return DateAddWithoutUnderscore(
            date_part=unit.removesuffix("s"), interval=duration, term=target_column
        )


SQLTranslator.register(SnowflakeTranslator)
