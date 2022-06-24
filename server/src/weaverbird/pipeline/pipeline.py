from typing import Any, Dict, List, Union

from pydantic import BaseModel, Field
from typing_extensions import Annotated

from weaverbird.pipeline.steps.hierarchy import HierarchyStep

from .steps import (
    AbsoluteValueStep,
    AbsoluteValueStepWithVariable,
    AddMissingDatesStep,
    AddMissingDatesStepWithVariables,
    AggregateStep,
    AggregateStepWithVariables,
    AppendStep,
    AppendStepWithVariable,
    ArgmaxStep,
    ArgmaxStepWithVariable,
    ArgminStep,
    ArgminStepWithVariable,
    CompareTextStep,
    CompareTextStepWithVariables,
    ConcatenateStep,
    ConcatenateStepWithVariable,
    ConvertStep,
    CumSumStep,
    CumSumStepWithVariable,
    CustomSqlStep,
    CustomStep,
    DateExtractStep,
    DateExtractStepWithVariable,
    DeleteStep,
    DissolveStep,
    DomainStep,
    DuplicateStep,
    DurationStep,
    DurationStepWithVariable,
    EvolutionStep,
    EvolutionStepWithVariable,
    FillnaStep,
    FillnaStepWithVariable,
    FilterStep,
    FilterStepWithVariables,
    FormulaStep,
    FormulaStepWithVariable,
    FromdateStep,
    IfthenelseStep,
    IfThenElseStepWithVariables,
    JoinStep,
    JoinStepWithVariable,
    LowercaseStep,
    MovingAverageStep,
    PercentageStep,
    PivotStep,
    PivotStepWithVariable,
    RankStep,
    RankStepWithVariable,
    RenameStep,
    RenameStepWithVariable,
    ReplaceStep,
    ReplaceStepWithVariable,
    RollupStep,
    RollupStepWithVariable,
    SelectStep,
    SimplifyStep,
    SortStep,
    SplitStep,
    SplitStepWithVariable,
    StatisticsStep,
    SubstringStep,
    TextStep,
    TextStepWithVariable,
    ToDateStep,
    TopStep,
    TopStepWithVariables,
    TotalsStep,
    TotalsStepWithVariable,
    TrimStep,
    UniqueGroupsStep,
    UniqueGroupsStepWithVariable,
    UnpivotStep,
    UnpivotStepWithVariable,
    UppercaseStep,
    WaterfallStep,
    WaterfallStepWithVariable,
)

PipelineStep = Annotated[
    Union[
        AbsoluteValueStep,
        AddMissingDatesStep,
        AggregateStep,
        AppendStep,
        ArgmaxStep,
        ArgminStep,
        CompareTextStep,
        ConcatenateStep,
        ConvertStep,
        CumSumStep,
        CustomSqlStep,
        CustomStep,
        DateExtractStep,
        DeleteStep,
        DissolveStep,
        DomainStep,
        DuplicateStep,
        DurationStep,
        EvolutionStep,
        FillnaStep,
        FilterStep,
        FormulaStep,
        FromdateStep,
        FromdateStep,
        HierarchyStep,
        IfthenelseStep,
        JoinStep,
        LowercaseStep,
        MovingAverageStep,
        PercentageStep,
        PivotStep,
        RankStep,
        RenameStep,
        ReplaceStep,
        RollupStep,
        SelectStep,
        SimplifyStep,
        SortStep,
        SplitStep,
        StatisticsStep,
        SubstringStep,
        TextStep,
        ToDateStep,
        TopStep,
        TotalsStep,
        TrimStep,
        UniqueGroupsStep,
        UnpivotStep,
        UppercaseStep,
        WaterfallStep,
    ],
    Field(discriminator='name'),  # noqa: F821
]


class Pipeline(BaseModel):
    steps: List[PipelineStep]

    def dict(self, *, exclude_none: bool = True, **kwargs) -> Dict:
        return super().dict(exclude_none=True, **kwargs)


PipelineStepWithVariables = Annotated[
    Union[
        AbsoluteValueStepWithVariable,
        AddMissingDatesStepWithVariables,
        AggregateStepWithVariables,
        AppendStepWithVariable,
        ArgmaxStepWithVariable,
        ArgminStepWithVariable,
        CompareTextStepWithVariables,
        ConcatenateStepWithVariable,
        CumSumStepWithVariable,
        DateExtractStepWithVariable,
        DurationStepWithVariable,
        EvolutionStepWithVariable,
        FillnaStepWithVariable,
        FilterStepWithVariables,
        FormulaStepWithVariable,
        IfThenElseStepWithVariables,
        JoinStepWithVariable,
        PivotStepWithVariable,
        RankStepWithVariable,
        RenameStepWithVariable,
        ReplaceStepWithVariable,
        RollupStepWithVariable,
        SplitStepWithVariable,
        TextStepWithVariable,
        TopStepWithVariables,
        TotalsStepWithVariable,
        UniqueGroupsStepWithVariable,
        UnpivotStepWithVariable,
        WaterfallStepWithVariable,
    ],
    Field(discriminator='name'),  # noqa: F821
]


class PipelineWithVariables(BaseModel):
    steps: List[Union[PipelineStepWithVariables, PipelineStep]]

    def render(self, variables: Dict[str, Any], renderer) -> Pipeline:
        # TODO it must be more efficient to render the full pipeline once
        steps_rendered = [
            step.render(variables, renderer) if hasattr(step, 'render') else step  # type: ignore
            for step in self.steps
        ]
        return Pipeline(steps=steps_rendered)
