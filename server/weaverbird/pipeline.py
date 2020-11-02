from typing import List, Union

from pydantic import BaseModel

from weaverbird.steps import DomainStep, FilterStep, JoinStep, RenameStep

PipelineStep = Union[DomainStep, FilterStep, JoinStep, RenameStep]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
