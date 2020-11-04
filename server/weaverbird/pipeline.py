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
    LowercaseStep,
    RenameStep,
    FillnaStep
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
    FillnaStep,
    FilterStep,
    FormulaStep,
    JoinStep,
    RenameStep,
    LowercaseStep,
]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
