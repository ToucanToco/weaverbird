from typing import Any, Callable, List, Optional, Protocol, Tuple

from pydantic import BaseModel

from weaverbird.pipeline import Pipeline


class SQLStepTranslationReport(BaseModel):
    step_index: int


class SQLPipelineTranslationReport(BaseModel):
    sql_steps_translation_reports: List[SQLStepTranslationReport]


SQLQueryRetriever = Callable[[str], str]
SQLPipelineTranslator = Callable[
    [Pipeline, SQLQueryRetriever], Tuple[str, SQLPipelineTranslationReport]
]


class SQLStepTranslator(Protocol):
    def __call__(
        self,
        step: Any,
        query: str,
        sql_query_retriever: Optional[SQLQueryRetriever],
        sql_translate_pipeline: Optional[SQLPipelineTranslator],
    ) -> str:
        ...
