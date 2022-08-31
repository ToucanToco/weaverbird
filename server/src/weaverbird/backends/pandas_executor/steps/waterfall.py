import numpy
import pandas as pd
from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps.waterfall import (
    _RESULT_COLUMN,
    GROUP_WATERFALL_COLUMN,
    LABEL_WATERFALL_COLUMN,
    TYPE_WATERFALL_COLUMN,
    WaterfallStep,
)


def execute_waterfall(
    step: WaterfallStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    # first milestone
    start_df = df[df[step.milestonesColumn] == step.start].rename(
        columns={step.valueColumn: f"{step.valueColumn}_start"}
    )
    # second milestone
    end_df = df[df[step.milestonesColumn] == step.end].rename(
        columns={step.valueColumn: f"{step.valueColumn}_end"}
    )

    upper = compute_agg_milestone(
        step,
        df,
        start_df.rename(columns={f"{step.valueColumn}_start": step.valueColumn}),
        step.start,
    )
    mid = compute_mid(step, merge(step, start_df, end_df), df)
    downer = compute_agg_milestone(
        step, df, end_df.rename(columns={f"{step.valueColumn}_end": step.valueColumn}), step.end
    )
    return pd.concat([upper, mid, downer])


# start_df is the base dataframe filtered to contains only result at the start of the waterfall
# end_df is the base dataframe filtered to contains only result at the start of the waterfall
# this methods compute the difference for the value value of every label between the end and the start
def merge(step: WaterfallStep, start_df: DataFrame, end_df: DataFrame) -> DataFrame:
    group_by_columns = [step.labelsColumn] + step.groupby
    if step.parentsColumn is not None:
        group_by_columns = group_by_columns + [step.parentsColumn]
    start_df = (
        start_df.groupby(by=group_by_columns)
        .agg({step.valueColumn + "_start": "sum"})
        .merge(start_df[group_by_columns], on=group_by_columns)
        .rename(columns={step.labelsColumn + "_x": step.labelsColumn})
        .drop_duplicates()
    )

    end_df = (
        end_df.groupby(by=group_by_columns)
        .agg({step.valueColumn + "_end": "sum"})
        .merge(end_df[group_by_columns], on=group_by_columns)
        .rename(columns={step.labelsColumn + "_x": step.labelsColumn})
        .drop_duplicates()
    )
    # we join the result to compare them
    merged_df = start_df.merge(end_df, on=get_join_key(step))
    merged_df[_RESULT_COLUMN] = (
        merged_df[f"{step.valueColumn}_end"] - merged_df[f"{step.valueColumn}_start"]
    )
    merged_df = merged_df.drop(
        columns=[
            f"{step.valueColumn}_start",
            f"{step.valueColumn}_end",
        ]
    )

    # if there is a parent column, we need to aggregate for them
    if step.parentsColumn is not None:
        parents_results = merged_df.groupby(
            step.groupby + [step.parentsColumn], as_index=False
        ).agg({_RESULT_COLUMN: "sum"})
        parents_results[step.labelsColumn] = parents_results[step.parentsColumn]
        return pd.concat([merged_df, parents_results])
    return merged_df


# the waterfall has a very specific structure.
# this methods create the top / bottom rows.
# these contains the sum of values for the whole milestone, regardless of label.
def compute_agg_milestone(
    step: WaterfallStep, df: DataFrame, start_df: DataFrame, milestone
) -> pd.DataFrame:
    if len(step.groupby) > 0:
        groups = df[step.groupby].drop_duplicates()
        group_by = step.groupby
    else:
        groups = pd.DataFrame({"_VQB_GROUP": [0]})  # pseudo group
        start_df["_VQB_GROUP"] = 0
        groups["_VQB_GROUP"] = 0
        group_by = ["_VQB_GROUP"]

    groups = groups.assign(**{step.labelsColumn: milestone})

    agg = start_df.groupby(group_by).agg({f"{step.valueColumn}": "sum"})
    agg = (
        groups.merge(agg, on=group_by)
        .sort_values(
            by=step.valueColumn if step.sortBy == "value" else step.labelsColumn,
            ascending=step.order == "asc",
        )
        .rename(columns={step.labelsColumn: LABEL_WATERFALL_COLUMN})
    )

    if step.parentsColumn is not None:
        agg[GROUP_WATERFALL_COLUMN] = agg[LABEL_WATERFALL_COLUMN].astype(str)
    agg[TYPE_WATERFALL_COLUMN] = None
    agg[LABEL_WATERFALL_COLUMN] = agg[LABEL_WATERFALL_COLUMN].astype(str)
    if len(step.groupby) == 0:
        del start_df["_VQB_GROUP"]
        del agg["_VQB_GROUP"]
    return agg


# this method shapes the merged DF so it matches the waterfall format
def compute_mid(step: WaterfallStep, merged_df: DataFrame, df: DataFrame) -> DataFrame:
    result_df = DataFrame(
        {
            LABEL_WATERFALL_COLUMN: merged_df.sort_values(
                by=get_sort_column(step), ascending=step.order == "asc"
            )[step.labelsColumn].astype(str)
        }
    )
    result_df[step.groupby] = merged_df.sort_values(
        by=get_sort_column(step), ascending=step.order == "asc"
    )[step.groupby]

    if step.parentsColumn is None:
        result_df[TYPE_WATERFALL_COLUMN] = "Parent"
    else:
        result_df[GROUP_WATERFALL_COLUMN] = merged_df.sort_values(
            by=get_sort_column(step), ascending=step.order == "asc"
        )[step.parentsColumn]
        result_df[TYPE_WATERFALL_COLUMN] = numpy.where(
            result_df["LABEL_waterfall"] == (result_df[GROUP_WATERFALL_COLUMN]),
            ["parent"],
            ["child"],
        )

    result_df[step.valueColumn] = merged_df.sort_values(
        by=get_sort_column(step), ascending=step.order == "asc"
    )[_RESULT_COLUMN]
    return result_df


def get_sort_column(step: WaterfallStep):
    if step.sortBy == "value":
        return _RESULT_COLUMN
    else:
        return step.labelsColumn


def get_join_key(step: WaterfallStep):
    if step.parentsColumn is None:
        return [step.labelsColumn] + step.groupby
    else:
        return [step.labelsColumn, step.parentsColumn] + step.groupby
