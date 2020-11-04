from typing import List, Union

from pydantic import BaseModel

from weaverbird.steps import (
    AppendStep,
    ArgmaxStep,
    ArgminStep,
    ConcatenateStep,
    ConvertStep,
    CumSumStep,
    DateExtractStep,
    DomainStep,
    FilterStep,
    JoinStep,
    LowercaseStep,
    RenameStep,
)

PipelineStep = Union[
    AppendStep,
    ArgmaxStep,
    ArgminStep,
    ConcatenateStep,
    ConvertStep,
    CumSumStep,
    DateExtractStep,
    DomainStep,
    FilterStep,
    JoinStep,
    RenameStep,
    LowercaseStep,
]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
