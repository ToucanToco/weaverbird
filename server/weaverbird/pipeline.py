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
    EvolutionStep,
    FilterStep,
    FormulaStep,
    JoinStep,
    RenameStep,
    FromdateStep,
    LowercaseStep,
]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
