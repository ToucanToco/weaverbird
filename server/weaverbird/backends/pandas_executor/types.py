from typing import Any, Callable, List, Optional, Tuple

from pandas import DataFrame
from pydantic import BaseModel, Field

from weaverbird.pipeline import Pipeline


class StepExecutionReport(BaseModel):
    step_index: int
    time_spent_in_ms: int
    memory_used_in_bytes: int


class PipelineExecutionReport(BaseModel):
    steps_reports: List[StepExecutionReport] = Field(min_items=0)


DomainRetriever = Callable[[str], DataFrame]
PipelineExecutor = Callable[[Pipeline, DomainRetriever], Tuple[DataFrame, PipelineExecutionReport]]
StepExecutor = Callable[
    [Any, DataFrame, Optional[DomainRetriever], Optional[PipelineExecutor]], DataFrame
]
