from typing import List, Union

from pydantic import BaseModel

from weaverbird.steps import DomainStep, FilterStep

PipelineStep = Union[DomainStep, FilterStep]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
