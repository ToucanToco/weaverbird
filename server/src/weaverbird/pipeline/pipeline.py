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

VOID_REPR = "__VOID__"


def _remove_void_from_combo_condition(
    condition: ConditionComboAnd | ConditionComboOr,
) -> ConditionComboAnd | ConditionComboOr | None:
    """
    Loop into a combo condition and search for embedded condition that may
    contains __VOID__ as column/value
    """
    sanitized_conditions: list[Condition] = []
    combo = "and_" if hasattr(condition, "and_") else "or_"

    for cond in getattr(condition, combo) or []:
        if (transformed_condition := _remove_void_from_condition(cond)) is not None:
            sanitized_conditions.append(transformed_condition)
    if len(sanitized_conditions) == 0:
        return None

    setattr(condition, combo, sanitized_conditions)

    return condition


def _remove_void_from_condition(condition: Condition) -> Condition | None:
    """
    For a given condition either it's a combo or a simple condition
    recursively check for it's columns and values and remove the one
    with column/value = __VOID__

    """
    if isinstance(condition, (ConditionComboAnd, ConditionComboOr)):
        condition = _remove_void_from_combo_condition(condition)
    elif isinstance(condition, (ComparisonCondition, MatchCondition, DateBoundCondition)):
        if condition.column == VOID_REPR or condition.value == VOID_REPR:
            return None
    elif isinstance(condition, InclusionCondition):
        condition_values = [v for v in condition.value if v != VOID_REPR]
        if len(condition_values) == 0:
            return None
        condition.value = condition_values

    return condition


def remove_void_conditions_from_filter_steps(
    steps: list[PipelineStepWithVariables | PipelineStep],
) -> list[PipelineStepWithVariables | PipelineStep]:
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


def _remove_empty_elements(data: Any) -> Any:
    """
    This should delete all empty arrays and empty dict
    """
    if isinstance(data, dict):
        data_transformed = {
            k: cleaned
            for k, v in data.items()
            if (cleaned := _remove_empty_elements(v)) is not None
        }
        return data_transformed or None
    elif isinstance(data, list):
        data_transformed = [
            cleaned for item in data if (cleaned := _remove_empty_elements(item)) is not None  # type: ignore[assignment]
        ]
        return data_transformed or None
    else:
        return data


def remove_void_conditions_from_mongo_steps(
    mongo_steps: dict[str, Any] | list[Any] | None,
) -> dict[str, Any] | list[Any] | None:
    """
    This method will remove element with value string as "__VOID__"
    """

    if isinstance(mongo_steps, dict):
        step = {}
        for key, val in mongo_steps.items():
            if isinstance(val, str):
                if val.strip() == VOID_REPR:
                    continue
                step[key] = val
            else:
                step[key] = remove_void_conditions_from_mongo_steps(val)  # type: ignore[assignment]
        return _remove_empty_elements(step)
    elif isinstance(mongo_steps, list):
        return _remove_empty_elements(
            [
                s_transformed
                for s_transformed in (
                    remove_void_conditions_from_mongo_steps(s) for s in mongo_steps
                )
                if s_transformed is not None
            ]
        )
    else:
        return mongo_steps


class PipelineWithVariables(BaseModel):
    steps: list[PipelineStepWithVariables | PipelineStep]

    def render(self, variables: dict[str, Any], renderer) -> Pipeline:
        # TODO it must be more efficient to render the full pipeline once
        steps_rendered = [
            step.render(variables, renderer) if hasattr(step, "render") else step  # type: ignore
            for step in self.steps
        ]
        return Pipeline(steps=steps_rendered)
