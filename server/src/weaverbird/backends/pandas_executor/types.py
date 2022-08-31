from typing import Any, List, Optional, Protocol, Tuple, Union
from collections.abc import Callable

from pandas import DataFrame
from pydantic import BaseModel, Field

from weaverbird.pipeline import Pipeline
from weaverbird.pipeline.steps.utils.combination import Reference


class StepExecutionReport(BaseModel):
    step_index: int
    time_spent_in_ms: int
    memory_used_in_bytes: int


class PipelineExecutionReport(BaseModel):
    steps_reports: list[StepExecutionReport] = Field(min_items=0)


DomainRetriever = Callable[[Union[str, Reference]], DataFrame]
PipelineExecutor = Callable[[Pipeline, DomainRetriever], tuple[DataFrame, PipelineExecutionReport]]


class StepExecutor(Protocol):
    def __call__(
        self,
        step: Any,
        df: DataFrame,
        domain_retriever: DomainRetriever | None,
        execute_pipeline: PipelineExecutor | None,
    ) -> DataFrame:
        ...
