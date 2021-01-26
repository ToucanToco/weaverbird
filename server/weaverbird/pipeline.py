from typing import Any, Dict, List, Union

from pydantic import BaseModel

from weaverbird.steps import (
    AddMissingDatesStep,
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
    DurationStep,
    EvolutionStep,
    FillnaStep,
    FilterStep,
    FilterStepWithVariables,
    FormulaStep,
    FromdateStep,
    IfthenelseStep,
    JoinStep,
    LowercaseStep,
    PercentageStep,
    PivotStep,
    RankStep,
    RenameStep,
    ReplaceStep,
    RollupStep,
    SelectStep,
    SortStep,
    SplitStep,
    StatisticsStep,
    SubstringStep,
    TextStep,
    ToDateStep,
    TopStep,
    TopStepWithVariables,
    TotalsStep,
    UniqueGroupsStep,
    UnpivotStep,
    UppercaseStep,
    WaterfallStep,
)
from weaverbird.steps.aggregate import AggregateStepWithVariables
from weaverbird.steps.ifthenelse import IfThenElseWithVariables

PipelineStep = Union[
    AddMissingDatesStep,
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
    DurationStep,
    EvolutionStep,
    FillnaStep,
    FilterStep,
    FromdateStep,
    FormulaStep,
    JoinStep,
    RankStep,
    RenameStep,
    PercentageStep,
    StatisticsStep,
    IfthenelseStep,
    FromdateStep,
    LowercaseStep,
    SelectStep,
    PivotStep,
    ReplaceStep,
    SortStep,
    TextStep,
    UnpivotStep,
    TopStep,
    ToDateStep,
    RollupStep,
    UniqueGroupsStep,
    UppercaseStep,
    SplitStep,
    SubstringStep,
    WaterfallStep,
    TotalsStep,
]


class Pipeline(BaseModel):
    steps: List[PipelineStep]


PipelineStepWithVariables = Union[
    AggregateStepWithVariables,
    FilterStepWithVariables,
    TopStepWithVariables,
    IfThenElseWithVariables,
]


class PipelineWithVariables(BaseModel):
    steps: List[PipelineStepWithVariables]

    def render(self, variables: Dict[str, Any]) -> Pipeline:
        # TODO it must be more efficient to render the full pipeline once
        steps_rendered = [step.render(variables) for step in self.steps]
        return Pipeline(steps=steps_rendered)
