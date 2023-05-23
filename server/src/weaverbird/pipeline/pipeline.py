from typing import Annotated, Any

from pydantic import BaseModel, Field

from weaverbird.pipeline.conditions import (
    ComparisonCondition,
    Condition,
    ConditionComboAnd,
    ConditionComboOr,
    DateBoundCondition,
    InclusionCondition,
    MatchCondition,
)
from weaverbird.pipeline.steps.hierarchy import HierarchyStep
from weaverbird.pipeline.steps.utils.base import BaseStep

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
    ReplaceTextStep,
    ReplaceTextStepWithVariable,
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
    AbsoluteValueStep
    | AddMissingDatesStep
    | AggregateStep
    | AppendStep
    | ArgmaxStep
    | ArgminStep
    | CompareTextStep
    | ConcatenateStep
    | ConvertStep
    | CumSumStep
    | CustomSqlStep
    | CustomStep
    | DateExtractStep
    | DeleteStep
    | DissolveStep
    | DomainStep
    | DuplicateStep
    | DurationStep
    | EvolutionStep
    | FillnaStep
    | FilterStep
    | FormulaStep
    | FromdateStep
    | FromdateStep
    | HierarchyStep
    | IfthenelseStep
    | JoinStep
    | LowercaseStep
    | MovingAverageStep
    | PercentageStep
    | PivotStep
    | RankStep
    | RenameStep
    | ReplaceStep
    | ReplaceTextStep
    | RollupStep
    | SelectStep
    | SimplifyStep
    | SortStep
    | SplitStep
    | StatisticsStep
    | SubstringStep
    | TextStep
    | ToDateStep
    | TopStep
    | TotalsStep
    | TrimStep
    | UniqueGroupsStep
    | UnpivotStep
    | UppercaseStep
    | WaterfallStep,
    Field(discriminator="name"),  # noqa: F821
]


class Pipeline(BaseModel):
    steps: list[PipelineStep]

    def dict(self, *, exclude_none: bool = True, **kwargs) -> dict:
        return super().dict(exclude_none=True, **kwargs)


PipelineStepWithVariables = Annotated[
    AbsoluteValueStepWithVariable
    | AddMissingDatesStepWithVariables
    | AggregateStepWithVariables
    | AppendStepWithVariable
    | ArgmaxStepWithVariable
    | ArgminStepWithVariable
    | CompareTextStepWithVariables
    | ConcatenateStepWithVariable
    | CumSumStepWithVariable
    | DateExtractStepWithVariable
    | DurationStepWithVariable
    | EvolutionStepWithVariable
    | FillnaStepWithVariable
    | FilterStepWithVariables
    | FormulaStepWithVariable
    | IfThenElseStepWithVariables
    | JoinStepWithVariable
    | PivotStepWithVariable
    | RankStepWithVariable
    | RenameStepWithVariable
    | ReplaceStepWithVariable
    | ReplaceTextStepWithVariable
    | RollupStepWithVariable
    | SplitStepWithVariable
    | TextStepWithVariable
    | TopStepWithVariables
    | TotalsStepWithVariable
    | UniqueGroupsStepWithVariable
    | UnpivotStepWithVariable
    | WaterfallStepWithVariable,
    Field(discriminator="name"),  # noqa: F821
]


def _remove_void_from_combo_condition(
    condition: ConditionComboAnd | ConditionComboOr | None, combo: str
) -> ConditionComboAnd | ConditionComboOr | None:
    """
    Loop into a combo condition and search for embedded condition that may
    contains __VOID__ as column/value
    """
    if condition is None:
        return None

    loop_on: list[Condition] = []

    for cond in getattr(condition, combo) or []:
        if (transformed_condition := _remove_void_from_condition(cond)) is not None:
            loop_on.append(transformed_condition)
    if len(loop_on) == 0:
        return None
    else:
        if combo == "and_":
            condition.and_ = loop_on
        else:
            condition.or_ = loop_on

    return condition


def _remove_void_from_condition(condition: Condition | None) -> Condition | None:
    """
    For a given condition either it's a combo or a simple condition
    recursivelly check for it's columns and values and remove the one
    with column/value = __VOID__

    """
    if isinstance(condition, (ConditionComboAnd, ConditionComboOr)):
        if isinstance(condition, ConditionComboAnd):
            condition = _remove_void_from_combo_condition(condition, "and_")
        else:
            condition = _remove_void_from_combo_condition(condition, "or_")
    elif isinstance(
        condition, (ComparisonCondition, InclusionCondition, MatchCondition, DateBoundCondition)
    ):
        if condition.column == "__VOID__" or (
            isinstance(condition.value, str) and condition.value == "__VOID__"
        ):
            return None
        elif isinstance(
            condition.value,
            (ComparisonCondition, InclusionCondition, MatchCondition, DateBoundCondition),
        ):
            condition.value = _remove_void_from_condition(condition.value)

    return condition


def remove_void_conditions_from_filter_steps(
    steps: list[PipelineStepWithVariables | PipelineStep | BaseStep],
) -> list[PipelineStepWithVariables | PipelineStep | BaseStep]:
    """
    This method will remove all FilterStep with conditions having "__VOID__"
    in them. either the "value" key or the "column" key.
    """

    final_steps = []
    for step in steps:
        if isinstance(step, FilterStep):
            if (condition := _remove_void_from_condition(step.condition)) is not None:
                final_steps.append(FilterStep(condition=condition))
        else:
            final_steps.append(step)

    return final_steps


class PipelineWithVariables(BaseModel):
    steps: list[PipelineStepWithVariables | PipelineStep]

    def render(self, variables: dict[str, Any], renderer) -> Pipeline:
        # TODO it must be more efficient to render the full pipeline once
        steps_rendered = [
            step.render(variables, renderer) if hasattr(step, "render") else step  # type: ignore
            for step in self.steps
        ]
        # We clean __VOID__ values from filter steps conditions.
        return Pipeline(
            steps=remove_void_conditions_from_filter_steps(steps_rendered)  # type:ignore
        )
