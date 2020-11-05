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
    FillnaStep,
    FilterStep,
    FormulaStep,
    JoinStep,
    LowercaseStep,
    RankStep,
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
    FillnaStep,
    FilterStep,
    FormulaStep,
    JoinStep,
    RankStep,
    RenameStep,
    LowercaseStep,
]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
