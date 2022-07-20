from enum import Enum
from typing import TYPE_CHECKING, Any, TypeVar

from pypika import Field, Query, Table, functions
from pypika.queries import QueryBuilder
from pypika.terms import LiteralValue

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    SQLTranslator,
    StepContext,
)
from weaverbird.backends.sql_translator.steps.utils.query_transformation import handle_zero_division
from weaverbird.pipeline.steps.formula import FormulaStep

Self = TypeVar("Self", bound="GoogleBigQueryTranslator")

if TYPE_CHECKING:
    from weaverbird.pipeline.steps import SplitStep


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
        text="STRING",
        datetime="TIMESTAMP",
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = False
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.REGEXP_CONTAINS
    TO_DATE_OP = ToDateOp.PARSE_DATE

    def split(
        self: Self,
        *,
        builder: 'QueryBuilder',
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

    def formula(
        self: Self,
        *,
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "FormulaStep",
    ) -> StepContext:
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns, LiteralValue(handle_zero_division(step.formula)).as_(step.new_column)
        )

        return StepContext(query, columns + [step.new_column])


SQLTranslator.register(GoogleBigQueryTranslator)


class ParseDatetime(functions.Function):  # type: ignore[misc]
    def __init__(self, format: str, term: str | Field, alias: str | None = None) -> None:
        super().__init__("parse_datetime", format, term, alias=alias)
