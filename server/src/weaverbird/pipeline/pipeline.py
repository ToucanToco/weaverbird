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
EXCLUDE_CLEANING_FOR = (
    "prevValue",  # for the rank step, this needs to be kept
    "prevRank",  # for the rank step, this needs to be kept
    "$ne",  # for isnotnull (None -> null for mongo),
    "$eq",  # for isnull (None -> null for mongo)
    "localField",
    "foreignField",
    "_id",
)


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
        data_transformed: dict[str, Any] = {}

        for k, v in data.items():
            if k in EXCLUDE_CLEANING_FOR:
                data_transformed[k] = v
            else:
                if (cleaned := _remove_empty_elements(v)) is not None:
                    data_transformed[k] = cleaned

                if cleaned == [] and k in ["$or", "$nor", "$and"]:
                    data_transformed[k] = None

        if isinstance(data_transformed, list):
            return data_transformed
        else:
            return data_transformed or None

    elif isinstance(data, list):
        data_transformed = [
            cleaned
            for item in data
            if (cleaned := _remove_empty_elements(item)) is not None  # type: ignore[assignment]
        ]

        return data_transformed
    else:
        return data


def _clean_mongo_steps(
    mongo_steps: dict[str, Any] | list | None,
) -> dict[str, Any] | list | None:
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
                step[key] = _clean_mongo_steps(val)  # type: ignore[assignment]

        return _remove_empty_elements(step)
    elif isinstance(mongo_steps, list):
        return _remove_empty_elements(
            [
                s_transformed
                for s_transformed in (_clean_mongo_steps(s) for s in mongo_steps)
                if s_transformed is not None
            ]
        )
    else:
        return mongo_steps


def _is_empty_match_column(elem: Any):
    # Not matching None here, because we don't want to consider {'$match': {'col': None}} to be
    # empty
    if elem == {}:
        return True
    if isinstance(elem, dict):
        return _is_match_empty(elem)

    return False


def _is_match_empty(match_: dict) -> bool:
    return all(_is_empty_match_column(v) for v in match_.values())


def _is_match_statement(d: Any) -> bool:
    return isinstance(d, dict) and list(d.keys()) == ["$match"]


def _sanitize_match(query: dict) -> dict:
    if _is_match_empty(query):
        return {}
    if "$and" in query:
        and_condition = query["$and"]
        if isinstance(and_condition, list):
            query["$and"] = [elem for elem in and_condition if not _is_empty_match_column(elem)]
    return query


def _sanitize_query_matches(query: dict | list[dict]) -> Any:
    """Transforms match operations matching nothing into match-alls.

    If a $match would match nothing (for example, {'$match': {'field': {}}}), transform into a
    passthrough. It cannot be removed from the query to prevent having an empty query.
    """
    if isinstance(query, list):
        # we need to have $match as first step here
        if bool(query) and "$match" not in query[0]:
            query = [{"$match": {}}] + query

        return [
            {"$match": _sanitize_match(q["$match"])} if _is_match_statement(q) else q for q in query
        ]
    return query


def remove_void_conditions_from_mongo_steps(
    mongo_steps: dict | list[dict],
) -> dict | list[dict]:
    return _sanitize_query_matches(_clean_mongo_steps(mongo_steps) or [])


# TODO move to a dedicated variables module
class PipelineWithVariables(BaseModel):
    steps: list[PipelineStepWithVariables | PipelineStep]

    def render(self, variables: dict[str, Any], renderer) -> Pipeline:
        # TODO it must be more efficient to render the full pipeline once
        steps_rendered = [
            step.render(variables, renderer) if hasattr(step, "render") else step  # type: ignore
            for step in self.steps
        ]
        return Pipeline(steps=steps_rendered)


PipelineWithVariables.update_forward_refs()
