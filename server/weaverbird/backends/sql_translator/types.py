from typing import Any, Callable, List, Optional, Protocol, Tuple

from pydantic import BaseModel

from weaverbird.pipeline import Pipeline


class SQLStepTranslationReport(BaseModel):
    step_index: int


class SQLPipelineTranslationReport(BaseModel):
    sql_steps_translation_reports: List[SQLStepTranslationReport]


class SQLQuery(BaseModel):
    query_name: Optional[str]
    transformed_query: Optional[str]
    selection_query: Optional[str]


SQLQueryRetriever = Callable[[str], str]
SQLPipelineTranslator = Callable[
    [Pipeline, SQLQueryRetriever], Tuple[str, SQLPipelineTranslationReport]
]


class SQLStepTranslator(Protocol):
    def __call__(
        self,
        step: Any,
        query: SQLQuery,
        index,
        sql_query_retriever: Optional[SQLQueryRetriever],
        sql_translate_pipeline: Optional[SQLPipelineTranslator],
    ) -> str:
        ...
