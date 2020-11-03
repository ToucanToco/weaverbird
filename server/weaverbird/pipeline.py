from typing import List, Union

from pydantic import BaseModel

from weaverbird.steps import ConcatenateStep, DomainStep, FilterStep, JoinStep, RenameStep

PipelineStep = Union[ConcatenateStep, DomainStep, FilterStep, JoinStep, RenameStep]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
