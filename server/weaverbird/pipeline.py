from typing import List, Union

from pydantic import BaseModel

from weaverbird.steps import DomainStep, FilterStep, RenameStep

PipelineStep = Union[DomainStep, FilterStep, RenameStep]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
