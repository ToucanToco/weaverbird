from typing import List, Union

from pydantic import BaseModel

from weaverbird.steps.domain import DomainStep
from weaverbird.steps.filter import FilterStep

PipelineStep = Union[DomainStep, FilterStep]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
