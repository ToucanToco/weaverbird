from pypika import functions
from pypika.dialects import PostgreSQLQuery
from pypika.queries import Selectable

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    DateFormatMapping,
    SQLTranslator,
)


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
    DATE_FORMAT_MAPPING = DateFormatMapping(
        # https://www.postgresql.org/docs/current/functions-formatting.html
        day_number="DD",
        month_number="MM",
        month_short="Mon",
        # FM prefix prevents postgres from padding the month to 9 chars
        month_full="FMMonth",
        year="YYYY",
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.SIMILAR_TO
    TO_DATE_OP = ToDateOp.TO_TIMESTAMP

    @classmethod
    def _interval_to_seconds(cls, value: Selectable) -> functions.Function:
        return functions.Extract("epoch", value)


SQLTranslator.register(PostgreSQLTranslator)
