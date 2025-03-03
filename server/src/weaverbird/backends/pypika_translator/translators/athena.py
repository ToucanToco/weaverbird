from datetime import date, datetime
from typing import Any

from pypika import Query, functions
from pypika.enums import Dialects
from pypika.queries import QueryBuilder, Selectable
from pypika.terms import Case, CustomFunction, Field, Term

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    DateFormatMapping,
    SQLTranslator,
)


class ToMilliseconds(functions.Function):
    def __init__(self, field: Field):
        super().__init__("TO_MILLISECONDS", field)


class AthenaQueryBuilder(QueryBuilder):
    def __init__(self, **kwargs: Any) -> None:
        super().__init__(dialect=SQLDialect.ATHENA, **kwargs)

    # Does the same as the parent class, but with OFFSET before LIMIT
    def _apply_pagination(self, querystring: str) -> str:
        if self._offset:
            querystring += self._offset_sql()

        if self._limit is not None:
            querystring += self._limit_sql()

        return querystring


class AthenaQuery(Query):
    @classmethod
    def _builder(cls, **kwargs: Any) -> AthenaQueryBuilder:
        return AthenaQueryBuilder(**kwargs)


class AthenaTranslator(SQLTranslator):
    DIALECT = SQLDialect.ATHENA
    QUERY_CLS = AthenaQuery
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
    FROM_DATE_OP = FromDateOp.DATE_FORMAT

    @classmethod
    def _add_date(cls, *, target_column: Field, duration: int, unit: str, dialect: Dialects | None = None) -> Term:
        # We need implement our own function for athena because Presto requires the units to be
        # quoted. PyPika's DateAdd function removes them by applying LiteralValue to the unit
        custom = CustomFunction("DATE_ADD", ["unit", "duration", "target"])
        return custom(Term.wrap_constant(unit.removesuffix("s")), duration, target_column)

    @staticmethod
    def _wrap_split_part(term: Term) -> Term:
        # Athena is the only backend for which SPLIT_PART returns NULL fox out-of-range
        # indexes. Also, IF_NULL is not available
        return Case().when(term.isnull(), "").else_(term)

    @classmethod
    def _interval_to_seconds(cls, value: Selectable) -> functions.Function:
        return ToMilliseconds(value) / 1000

    @classmethod
    def _cast_to_timestamp(cls, value: str | date | datetime | Field | Term) -> functions.Function:
        if isinstance(value, date):
            value = datetime(value.year, value.month, value.day)
        if isinstance(value, datetime):
            value = value.strftime("%Y-%m-%d %H:%M:%S%z")
        return super()._cast_to_timestamp(value)


SQLTranslator.register(AthenaTranslator)
