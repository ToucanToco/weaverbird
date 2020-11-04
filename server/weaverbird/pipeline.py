from typing import List, Union

from pydantic import BaseModel

from weaverbird.steps import (
    AppendStep,
    ArgmaxStep,
    ConcatenateStep,
    DomainStep,
    FilterStep,
    JoinStep,
    RenameStep,
)

PipelineStep = Union[
    AppendStep, ConcatenateStep, DomainStep, FilterStep, JoinStep, RenameStep, ArgmaxStep
]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
