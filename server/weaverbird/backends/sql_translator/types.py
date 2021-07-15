from typing import Any, Callable, List, Optional, Protocol, Tuple

from pydantic import BaseModel

from weaverbird.pipeline import Pipeline


class StepTranslationReport(BaseModel):
    step_index: int


class PipelineTranslationReport(BaseModel):
    steps_translation_reports: List[StepTranslationReport]


QueryRetriever = Callable[[str], str]
PipelineTranslator = Callable[[Pipeline, QueryRetriever], Tuple[str, PipelineTranslationReport]]


class StepTranslator(Protocol):
    def __call__(
        self,
        step: Any,
        query: str,
        query_retriever: Optional[QueryRetriever],
        translate_pipeline: Optional[PipelineTranslator],
    ):
        ...
