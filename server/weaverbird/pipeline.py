from typing import List, Union

from pydantic import BaseModel

from weaverbird.steps import (
    AggregateStep,
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
    SelectStep,
)

PipelineStep = Union[
    AggregateStep,
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
    SelectStep,
]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
