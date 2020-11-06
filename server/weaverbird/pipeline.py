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
    EvolutionStep,
    FillnaStep,
    FilterStep,
    FormulaStep,
    FromdateStep,
    JoinStep,
    LowercaseStep,
    PivotStep,
    RenameStep,
    ReplaceStep,
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
    EvolutionStep,
    FilterStep,
    FormulaStep,
    JoinStep,
    PivotStep,
    RenameStep,
    ReplaceStep,
    FromdateStep,
    LowercaseStep,
]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
