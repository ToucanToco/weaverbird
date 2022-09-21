from pypika.dialects import Query
from pypika.enums import Dialects
from pypika.terms import Field, Interval, Term

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import DataTypeMapping, SQLTranslator


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
        cls, *, target_column: Field, duration: int, unit: str, dialect: Dialects | None = None
    ) -> Term:
        # Cheating a bit here: MySQL's syntax is compatible with Athena for intervals
        return target_column + Interval(**{unit: duration, "dialect": Dialects.MYSQL})


SQLTranslator.register(AthenaTranslator)
