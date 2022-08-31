from collections.abc import Callable
from typing import Any, Literal, Protocol

from pandas import DataFrame
from pydantic import BaseModel

from weaverbird.backends.sql_translator.metadata import SqlQueryMetadataManager
from weaverbird.pipeline import Pipeline


class SQLStepTranslationReport(BaseModel):
    step_index: int


class SQLPipelineTranslationReport(BaseModel):
    sql_steps_translation_reports: list[SQLStepTranslationReport]


class TableMetadataUpdateError(Exception):
    ...


class SQLQuery(BaseModel):
    query_name: str | None
    transformed_query: str | None
    selection_query: str | None
    metadata_manager: SqlQueryMetadataManager | None


SQLQueryRetriever = Callable[[str], str]
SQLQueryDescriber = Callable
SQLQueryExecutor = Callable[[str, str], DataFrame]

SQLPipelineTranslator = Callable[
    [Pipeline, SQLQueryRetriever, SQLQueryDescriber, SQLQueryExecutor],
    tuple[str, SQLPipelineTranslationReport],
]
SQLDialect = Literal["snowflake", "postgres"]


class SQLStepTranslator(Protocol):
    def __call__(
        self,
        step: Any,
        query: SQLQuery,
        index,
        sql_query_retriever: SQLQueryRetriever | None,
        sql_query_describer: SQLQueryDescriber | None,
        sql_query_executor: SQLQueryExecutor | None,
        sql_translate_pipeline: SQLPipelineTranslator | None,
        subcall_from_other_pipeline_count: int | None,
        sql_dialect: SQLDialect | None,
    ):
        ...
