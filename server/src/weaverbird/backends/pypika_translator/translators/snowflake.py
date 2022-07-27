from typing import TypeVar

from pypika.dialects import SnowflakeQuery
from pypika.terms import CustomFunction, Field

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DATE_UNIT,
    DataTypeMapping,
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
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.REGEXP
    TO_DATE_OP = ToDateOp.TO_DATE
    QUOTE_CHAR = '\"'

    @classmethod
    def _add_date(cls, *, date_column: Field, add_date_value: int, add_date_unit: DATE_UNIT):
        add_date_func = CustomFunction('DATEADD', ['interval', 'increment', 'datecol'])
        return add_date_func(add_date_unit, add_date_value, date_column)


SQLTranslator.register(SnowflakeTranslator)
