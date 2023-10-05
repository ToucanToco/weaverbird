from pypika.dialects import Query
from pypika.enums import Dialects
from pypika.terms import Case, CustomFunction, Field, Term

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    DateFormatMapping,
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
        float="DOUBLE",
        integer="INTEGER",
        text="VARCHAR",
        datetime="TIMESTAMP",
        timestamp="TIMESTAMP",
    )
    DATE_FORMAT_MAPPING = DateFormatMapping(
        # https://prestodb.io/docs/current/functions/datetime.html#mysql-date-functions
        day_number="%d",
        month_number="%m",
        month_short="%b",
        month_full="%M",
        year="%Y",
    )
    REGEXP_OP = RegexOp.REGEXP_LIKE
    TO_DATE_OP = ToDateOp.DATE_PARSE

    @classmethod
    def _add_date(
        cls, *, target_column: Field, duration: int, unit: str, dialect: Dialects | None = None
    ) -> Term:
        # We need implement our own function for athena because Presto requires the units to be
        # quoted. PyPika's DateAdd function removes them by applying LiteralValue to the unit
        custom = CustomFunction("DATE_ADD", ["unit", "duration", "target"])
        return custom(Term.wrap_constant(unit.removesuffix("s")), duration, target_column)

    @staticmethod
    def _wrap_split_part(term: Term) -> Term:
        # Athena is the only backend for which SPLIT_PART returns NULL fox out-of-range
        # indexes. Also, IF_NULL is not available
        return Case().when(term.isnull(), "").else_(term)


SQLTranslator.register(AthenaTranslator)
