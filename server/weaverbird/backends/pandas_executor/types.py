from typing import Callable, List, Tuple

from pandas import DataFrame
from pydantic import BaseModel, Field

from weaverbird.pipeline import Pipeline, PipelineStep


class StepExecutionReport(BaseModel):
    step_index: int
    time_spent_in_ms: int
    memory_used_in_bytes: int


class PipelineExecutionReport(BaseModel):
    steps_reports: List[StepExecutionReport] = Field(min_items=0)


DomainRetriever = Callable[[str], DataFrame]
PipelineExecutor = Callable[[Pipeline, DomainRetriever], Tuple[DataFrame, PipelineExecutionReport]]
StepExecutor = Callable[[PipelineStep, DataFrame, DomainRetriever, PipelineExecutor], DataFrame]
