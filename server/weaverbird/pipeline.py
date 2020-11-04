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
    IfthenelseStep,
    JoinStep,
    LowercaseStep,
    PivotStep,
    RankStep,
    RenameStep,
    ReplaceStep,
    StatisticsStep,
    TextStep,
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
    EvolutionStep,
    FillnaStep,
    FilterStep,
    FromdateStep,
    FormulaStep,
    JoinStep,
    RankStep,
    RenameStep,
    StatisticsStep,
    IfthenelseStep,
    FromdateStep,
    LowercaseStep,
    PivotStep,
    ReplaceStep,
    TextStep,
]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
