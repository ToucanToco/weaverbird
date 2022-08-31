from pypika.dialects import Query
from pypika.terms import CustomFunction, Field, Term

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DATE_INFO,
    DataTypeMapping,
    SQLTranslator,
)


class AthenaTranslator(SQLTranslator):
    DIALECT = SQLDialect.ATHENA
    QUERY_CLS = Query
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    SUPPORT_UNPIVOT = False
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="FLOAT",
        integer="INTEGER",
        text="VARCHAR",
        datetime="TIMESTAMP",
        timestamp="TIMESTAMP",
    )
    REGEXP_OP = RegexOp.REGEXP_LIKE
    TO_DATE_OP = ToDateOp.TIMESTAMP

    @classmethod
    def _add_date(
        cls, *, date_column: Field, add_date_value: int, add_date_unit: DATE_INFO
    ) -> Term:
        add_date_func = CustomFunction("DATE_ADD", ["interval", "increment", "datecol"])
        return add_date_func(add_date_unit, add_date_value, date_column)


SQLTranslator.register(AthenaTranslator)
