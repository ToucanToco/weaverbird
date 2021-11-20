from typing import Any, Callable, List, Optional, Protocol, Tuple

from pydantic import BaseModel

from weaverbird.backends.sql_translator.metadata import SqlQueryMetadataManager
from weaverbird.pipeline import Pipeline


class SQLStepTranslationReport(BaseModel):
    step_index: int


class SQLPipelineTranslationReport(BaseModel):
    sql_steps_translation_reports: List[SQLStepTranslationReport]


class TableMetadataUpdateError(Exception):
    ...


class SQLQuery(BaseModel):
    query_name: Optional[str]
    transformed_query: Optional[str]
    selection_query: Optional[str]
    metadata_manager: Optional[SqlQueryMetadataManager]


SQLQueryRetriever = Callable[[str], str]
SQLQueryDescriber = Callable
SQLQueryExecutor = Callable[[str, str], str]

SQLPipelineTranslator = Callable[
    [Pipeline, SQLQueryRetriever, SQLQueryDescriber, SQLQueryExecutor],
    Tuple[str, SQLPipelineTranslationReport],
]


class SQLStepTranslator(Protocol):
    def __call__(
        self,
        step: Any,
        query: SQLQuery,
        index,
        sql_query_retriever: Optional[SQLQueryRetriever],
        sql_query_describer: Optional[SQLQueryDescriber],
        sql_query_executor: Optional[SQLQueryExecutor],
        sql_translate_pipeline: Optional[SQLPipelineTranslator],
        subcall_from_other_pipeline_count: Optional[int],
    ):
        ...
