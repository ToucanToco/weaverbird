from functools import reduce
from typing import Any

import numpy
import pandas as pd
from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps.waterfall import (
    GROUP_WATERFALL_COLUMN,
    LABEL_WATERFALL_COLUMN,
    RESULT_COLUMN,
    TYPE_WATERFALL_COLUMN,
    WaterfallStep,
)

_VQB_SORT_ORDER = "_vqbSortOrder"
_VQB_GROUP = "_vqbGroup"

# Steps taken to execute a waterfall step:
# * Filter the input dataset on "label IN [start, end]"
# * If backfill is true, set 0 for all missing start/end values. If it is false, remove all rows for
#   groups which do not have a start/end value
# * For all groups ([label, (parent)] + groups), compute the difference between start and end labels
# * If there is a parent column, calculate the sums for the parent values as well
# * Return a dataframe in the following format
#     - One row with the total on start label
#     - One row with the delta for every group (label + groupby columns + optional parent)
#     - If there are parents, one row with the sum of deltas for all groups with this parent (can be
#       mixed up with children rows)
#     - One row with the total on end label


def execute_waterfall(
    step: WaterfallStep,
    df: DataFrame,
    domain_retriever: DomainRetriever | None = None,
    execute_pipeline: PipelineExecutor | None = None,
) -> DataFrame:
    # Start of the waterfall
    start_df = df[df[step.milestonesColumn] == step.start]
    # End of the waterfall
    end_df = df[df[step.milestonesColumn] == step.end]

    group_columns = _group_by_columns(step)
    start_value_groups = _unique_values_groups(start_df, group_columns)
    end_value_groups = _unique_values_groups(end_df, group_columns)
    unique_values_groups = start_value_groups.union(end_value_groups)

    # Backfilling missing values
    if step.backfill:
        start_df = _backfill_missing_values(start_df, step, step.labelsColumn, group_columns, unique_values_groups)
        end_df = _backfill_missing_values(end_df, step, step.labelsColumn, group_columns, unique_values_groups)
    # Otherwise, filter out rows which do not have a start and end date
    else:
        # We want to remove all value groups which are not in both the start and end dataframes
        value_groups_to_remove = unique_values_groups - start_value_groups.intersection(end_value_groups)
        start_df = _filter_out_rows(start_df, group_columns, value_groups_to_remove)
        end_df = _filter_out_rows(end_df, group_columns, value_groups_to_remove)

    start_df = start_df.rename(columns={step.valueColumn: f"{step.valueColumn}_start"})
    end_df = end_df.rename(columns={step.valueColumn: f"{step.valueColumn}_end"})

    merged = _merge(step, start_df, end_df)
    start_values = _compute_agg_milestone(
        step,
        df,
        start_df.rename(columns={f"{step.valueColumn}_start": step.valueColumn}),
        step.start,
        0,
    )
    parents_children = _compute_parents_and_children(step, merged)
    end_values = _compute_agg_milestone(
        step, df, end_df.rename(columns={f"{step.valueColumn}_end": step.valueColumn}), step.end, 3
    )
    result = pd.concat([start_values, parents_children, end_values])
    result.sort_values(
        by=[_VQB_SORT_ORDER, _get_sort_column(step)],
        ascending=[True, step.order == "asc"],
        inplace=True,
    )
    del result[_VQB_SORT_ORDER]
    return result


def _group_by_columns(step: WaterfallStep) -> list[str]:
    group_by_columns = [step.labelsColumn] + step.groupby
    if step.parentsColumn is not None:
        group_by_columns = group_by_columns + [step.parentsColumn]
    return group_by_columns


def _merge(step: WaterfallStep, start_df: DataFrame, end_df: DataFrame) -> DataFrame:
    """Computes the difference for the value of every label between end and start.

    :param start_df: Base DataFrame filtered to contain only results at the start of the waterfall
    :param end_df: Base DataFrame filtered to contain only results at the end of the waterfall
    """
    group_by_columns = _group_by_columns(step)
    start_df = (
        start_df.groupby(by=group_by_columns)
        .agg({step.valueColumn + "_start": "sum"})
        .merge(start_df[group_by_columns], on=group_by_columns)
        .drop_duplicates()
    )

    end_df = (
        end_df.groupby(by=group_by_columns)
        .agg({step.valueColumn + "_end": "sum"})
        .merge(end_df[group_by_columns], on=group_by_columns)
        .drop_duplicates()
    )

    # we join the result to compare them
    merged_df = start_df.merge(end_df, on=_get_join_key(step))
    merged_df[RESULT_COLUMN] = merged_df[f"{step.valueColumn}_end"] - merged_df[f"{step.valueColumn}_start"]
    merged_df = merged_df.drop(
        columns=[
            f"{step.valueColumn}_start",
            f"{step.valueColumn}_end",
        ]
    )

    # if there is a parent column, we need to aggregate for them
    if step.parentsColumn is not None:
        parents_results = merged_df.groupby(step.groupby + [step.parentsColumn], as_index=False).agg(
            {RESULT_COLUMN: "sum"}
        )
        parents_results[step.labelsColumn] = parents_results[step.parentsColumn]
        parents_results[TYPE_WATERFALL_COLUMN] = "parent"
        merged_df[TYPE_WATERFALL_COLUMN] = "child"
        return pd.concat([merged_df, parents_results])
    else:
        merged_df[TYPE_WATERFALL_COLUMN] = "parent"
    return merged_df


def _unique_values_groups(df: DataFrame, group_columns: list[str]) -> set[tuple[str, ...]]:
    return set(df[group_columns].drop_duplicates().to_records(index=False).tolist())


def _filter_out_rows(
    df: DataFrame, group_columns: list[str], value_groups_to_remove: set[tuple[str, ...]]
) -> DataFrame:
    if not value_groups_to_remove:
        return df

    for value_group_to_remove in value_groups_to_remove:
        conditions = (df[col] == val for col, val in zip(group_columns, value_group_to_remove, strict=True))
        condition = reduce(lambda s1, s2: s1 & s2, conditions)
        df = df[~condition]

    return df


def _backfill_missing_values(
    df: DataFrame,
    step: WaterfallStep,
    label_value: str,
    group_columns: list[str],
    unique_values_groups: set[tuple[str, ...]],
    backfill_value: int = 0,
) -> DataFrame:
    missing_value_groups = unique_values_groups - _unique_values_groups(df, group_columns)
    if not missing_value_groups:
        return df

    new_rows: list[dict[str, Any]] = []
    for missing_groups in missing_value_groups:
        new_rows.append(
            {
                step.labelsColumn: label_value,
                step.valueColumn: backfill_value,
                **dict(zip(group_columns, missing_groups, strict=True)),
            }
        )

    return pd.concat([df, pd.DataFrame(new_rows)])


def _compute_agg_milestone(
    step: WaterfallStep, df: DataFrame, start_df: DataFrame, milestone, sort_order: int
) -> pd.DataFrame:
    """Creates the top and bottom rows for waterfalls"""
    if len(step.groupby) > 0:
        groups = df[step.groupby].drop_duplicates()
        group_by = step.groupby
    else:
        groups = pd.DataFrame({_VQB_GROUP: [0]})  # pseudo group
        start_df[_VQB_GROUP] = 0
        groups[_VQB_GROUP] = 0
        group_by = [_VQB_GROUP]

    groups = groups.assign(**{step.labelsColumn: milestone})

    agg = start_df.groupby(group_by).agg({f"{step.valueColumn}": "sum"})
    agg = groups.merge(agg, on=group_by).rename(columns={step.labelsColumn: LABEL_WATERFALL_COLUMN})

    if step.parentsColumn is not None:
        agg[GROUP_WATERFALL_COLUMN] = agg[LABEL_WATERFALL_COLUMN].astype(str)
    agg[TYPE_WATERFALL_COLUMN] = None
    agg[LABEL_WATERFALL_COLUMN] = agg[LABEL_WATERFALL_COLUMN].astype(str)
    if len(step.groupby) == 0:
        del start_df[_VQB_GROUP]
        del agg[_VQB_GROUP]
    agg[_VQB_SORT_ORDER] = sort_order
    return agg


def _compute_parents_and_children(step: WaterfallStep, merged_df: DataFrame) -> DataFrame:
    """Computes children values (the deepest nesting level)"""
    result_df = DataFrame({LABEL_WATERFALL_COLUMN: merged_df[step.labelsColumn].astype(str)})
    result_df[step.groupby] = merged_df[step.groupby]
    result_df[TYPE_WATERFALL_COLUMN] = merged_df[TYPE_WATERFALL_COLUMN]

    if step.parentsColumn is None:
        result_df[_VQB_SORT_ORDER] = 2
    else:
        result_df[GROUP_WATERFALL_COLUMN] = merged_df[step.parentsColumn]
        result_df[_VQB_SORT_ORDER] = numpy.where(result_df[TYPE_WATERFALL_COLUMN] == "parent", 2, 1)

    result_df[step.valueColumn] = merged_df[RESULT_COLUMN]
    return result_df


def _get_sort_column(step: WaterfallStep):
    if step.sortBy == "value":
        return step.valueColumn
    else:
        return LABEL_WATERFALL_COLUMN


def _get_join_key(step: WaterfallStep):
    if step.parentsColumn is None:
        return [step.labelsColumn] + step.groupby
    else:
        return [step.labelsColumn, step.parentsColumn] + step.groupby
