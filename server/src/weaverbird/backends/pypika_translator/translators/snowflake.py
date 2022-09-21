from typing import TypeVar

from pypika.dialects import SnowflakeQuery
from pypika.enums import Dialects
from pypika.terms import Field, Term

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    DateAddWithoutUnderscore,
    SQLTranslator,
)

Self = TypeVar("Self", bound="SQLTranslator")


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
