from typing import TypeVar

from pypika.dialects import RedshiftQuery

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import DataTypeMapping, SQLTranslator
from weaverbird.backends.pypika_translator.translators.postgresql import PostgreSQLTranslator

Self = TypeVar("Self", bound="SQLTranslator")


class RedshiftTranslator(PostgreSQLTranslator):
    DIALECT = SQLDialect.REDSHIFT
    QUERY_CLS = RedshiftQuery
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="DOUBLE PRECISION",
        integer="INTEGER",
        text="TEXT",
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.SIMILAR_TO
    TO_DATE_OP = ToDateOp.TO_DATE


SQLTranslator.register(RedshiftTranslator)
