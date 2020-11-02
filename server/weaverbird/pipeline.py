from typing import List, Union

from pydantic import BaseModel

from weaverbird.steps import (
    AppendStep,
    ConcatenateStep,
    ConvertStep,
    CumsumStep,
    DomainStep,
    FilterStep,
    JoinStep,
    RenameStep,
)

PipelineStep = Union[
    AppendStep,
    ConcatenateStep,
    ConvertStep,
    CumsumStep,
    DomainStep,
    FilterStep,
    JoinStep,
    RenameStep,
]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
