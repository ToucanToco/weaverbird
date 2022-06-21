from enum import Enum
from typing import TYPE_CHECKING, Any, TypeVar

from pypika import Criterion, Field, Query, Table, functions
from pypika.queries import QueryBuilder

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    SQLTranslator,
    StepTable,
)
from weaverbird.pipeline.conditions import DateBoundCondition

Self = TypeVar("Self", bound="GoogleBigQueryTranslator")

if TYPE_CHECKING:
    from weaverbird.pipeline.conditions import SimpleCondition


class ExtraDialects(Enum):
    GOOGLE_BIG_QUERY = "googlebigquery"


class GoogleBigQueryQuery(Query):  # type: ignore[misc]
    @classmethod
    def _builder(cls, **kwargs: Any) -> "GoogleBigQueryQueryBuilder":
        return GoogleBigQueryQueryBuilder(**kwargs)


class GoogleBigQueryQueryBuilder(QueryBuilder):  # type: ignore[misc]
    QUOTE_CHAR = "`"
    SECONDARY_QUOTE_CHAR = "'"
    ALIAS_QUOTE_CHAR = None
    QUERY_ALIAS_QUOTE_CHAR = None
    QUERY_CLS = GoogleBigQueryQuery

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(dialect=ExtraDialects.GOOGLE_BIG_QUERY, **kwargs)


class GoogleBigQueryTranslator(SQLTranslator):
    DIALECT = SQLDialect.GOOGLEBIGQUERY
    QUERY_CLS = GoogleBigQueryQuery
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="DOUBLE PRECISION",
        integer="INTEGER",
        text="TEXT",
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = False
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.CONTAINS
    TO_DATE_OP = ToDateOp.PARSE_DATE

    def _get_single_condition_criterion(
        self: Self, condition: "SimpleCondition", table: StepTable
    ) -> Criterion:
        column_field: Field = Table(table.name)[condition.column]

        if isinstance(condition, DateBoundCondition):
            match condition.operator:
                case "from":
                    return functions.Cast(column_field, "datetime") >= ParseDatetime(
                        "%FT%T", condition.value
                    )
                case "until":
                    return functions.Cast(column_field, "datetime") <= ParseDatetime(
                        "%FT%T", condition.value
                    )

        return super()._get_single_condition_criterion(condition, table)


SQLTranslator.register(GoogleBigQueryTranslator)


class ParseDatetime(functions.Function):  # type: ignore[misc]
    def __init__(self, format: str, term: str | Field, alias: str | None = None) -> None:
        super().__init__("parse_datetime", format, term, alias=alias)
