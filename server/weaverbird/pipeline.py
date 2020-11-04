from typing import List, Union

from pydantic import BaseModel

from weaverbird.steps import (
    AggregateStep,
    AppendStep,
    ConcatenateStep,
    DomainStep,
    FilterStep,
    IfthenelseStep,
    JoinStep,
    RenameStep,
)

PipelineStep = Union[
    AppendStep,
    ConcatenateStep,
    DomainStep,
    FilterStep,
    JoinStep,
    RenameStep,
    AggregateStep,
    IfthenelseStep,
]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
