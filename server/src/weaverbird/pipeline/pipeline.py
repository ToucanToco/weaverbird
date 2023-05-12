from copy import copy
from typing import Annotated, Any

from pydantic import BaseModel, Field
from pydantic.error_wrappers import ValidationError

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


def _contains_void_as_value(value: dict) -> bool:
    return any(
        [
            value.get("value") == "__VOID__",
            value.get("column") == "__VOID__",
        ]
    )


def _remove_void_value_elements(obj: dict[str, Any] | list[dict[str, Any]]) -> None:
    if isinstance(obj, dict):
        keys_to_remove = (
            k for k, v in copy(obj).items() if isinstance(v, dict) and _contains_void_as_value(v)
        )
        for key in keys_to_remove:
            del obj[key]  # remove "condition" if __VOID__ is found

        for v in obj.values():
            _remove_void_value_elements(v)

        if "condition" in obj:
            if ("and_" in obj["condition"] and obj["condition"]["and_"] == []) or (
                "or_" in obj["condition"] and obj["condition"]["or_"] == []
            ):
                del obj["condition"]

    elif isinstance(obj, list):
        indices_to_remove = (
            i for i, v in enumerate(obj) if isinstance(v, dict) and _contains_void_as_value(v)
        )

        for index in sorted(indices_to_remove, reverse=True):
            del obj[index]
        for v in obj:
            _remove_void_value_elements(v)

        for index, v in enumerate(obj):
            if "or_" in v and v["or_"] == []:
                del obj[index]
            if "and_" in v and v["and_"] == []:
                del obj[index]


def _clean_filter_step(step: FilterStep) -> FilterStep:
    """
    Get a filter-step, clean it with it's dict representation
    """
    step_dict = step.dict()
    _remove_void_value_elements(step_dict)
    return FilterStep(**step_dict)


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
            try:
                final_steps.append(_clean_filter_step(step))
            except ValidationError:
                pass  # we skip non-valid filter steps
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
