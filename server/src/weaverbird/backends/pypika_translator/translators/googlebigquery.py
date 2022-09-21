from typing import TYPE_CHECKING, Any, TypeVar

from pypika import Field, Query, Table, functions
from pypika.enums import Dialects
from pypika.queries import QueryBuilder
from pypika.terms import Function, Interval, LiteralValue, Term

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    SQLTranslator,
    StepContext,
)

Self = TypeVar("Self", bound="GoogleBigQueryTranslator")

if TYPE_CHECKING:
    from weaverbird.pipeline.steps import SplitStep


class GoogleBigQueryQuery(Query):
    @classmethod
    def _builder(cls, **kwargs: Any) -> "GoogleBigQueryQueryBuilder":
        return GoogleBigQueryQueryBuilder(**kwargs)


class GoogleBigQueryQueryBuilder(QueryBuilder):
    QUOTE_CHAR = "`"
    SECONDARY_QUOTE_CHAR = "'"
    ALIAS_QUOTE_CHAR = None
    QUERY_ALIAS_QUOTE_CHAR = None
    QUERY_CLS = GoogleBigQueryQuery

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(dialect=SQLDialect.GOOGLEBIGQUERY, **kwargs)


class GoogleBigQueryDateAdd(Function):
    def __init__(self, *, target_column: Field, interval: Interval) -> None:
        super().__init__("DATE_ADD", target_column, interval)


class GoogleBigQueryTranslator(SQLTranslator):
    DIALECT = SQLDialect.GOOGLEBIGQUERY
    QUERY_CLS = GoogleBigQueryQuery
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="DOUBLE PRECISION",
        integer="INTEGER",
        text="STRING",
        datetime="TIMESTAMP",
        timestamp="TIMESTAMP",
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = False
    SUPPORT_UNPIVOT = True
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.REGEXP_CONTAINS
    TO_DATE_OP = ToDateOp.TIMESTAMP

    @classmethod
    def _add_date(
        cls, *, target_column: Field, duration: int, unit: str, dialect: Dialects | None = None
    ) -> Term:
        return GoogleBigQueryDateAdd(
            target_column=target_column,
            # Cheating a bit here: MySQL's syntax is compatible with GBQ for intervals
            interval=Interval(**{unit: duration, "dialect": Dialects.MYSQL}),
        )

    def split(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "SplitStep",
    ) -> StepContext:
        col_field: Field = Table(prev_step_name)[step.column]
        splitted_cols = [
            LiteralValue(f'SPLIT(`{col_field.name}`, "{step.delimiter}")[SAFE_OFFSET({i})]').as_(
                f"{step.column}_{i + 1}"
            )
            for i in range(step.number_cols_to_keep)
        ]
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns, *splitted_cols
        )
        return StepContext(query, columns + splitted_cols)


SQLTranslator.register(GoogleBigQueryTranslator)


class ParseDatetime(functions.Function):
    def __init__(self, format: str, term: str | Field, alias: str | None = None) -> None:
        super().__init__("parse_datetime", format, term, alias=alias)
