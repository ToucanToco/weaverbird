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
    DeleteStep,
    DomainStep,
    DuplicateStep,
    FilterStep,
    FormulaStep,
    JoinStep,
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
    DeleteStep,
    DomainStep,
    DuplicateStep,
    FilterStep,
    FormulaStep,
    JoinStep,
    RenameStep,
]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
