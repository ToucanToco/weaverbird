from typing import Any, Literal

from pandas import DataFrame, concat

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import AggregateStep

AggregateFn = Literal[
    "avg",
    "sum",
    "min",
    "max",
    "count",
    "count distinct",
    "first",
    "last",
    "count distinct including empty",
]

functions_aliases = {
    "avg": "mean",
    "count distinct": "nunique",
    "count distinct including empty": len,
}


def get_aggregate_fn(agg_function: str) -> Any:
    if agg_function in functions_aliases:
        return functions_aliases[agg_function]
    return agg_function


def execute_aggregate(
    step: AggregateStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    group_by_columns = step.on

    # if no group is specified, we create a pseudo column with a single value
    if len(group_by_columns) == 0:
        group_by_columns = ["__VQB__GROUP_BY__"]
        df = df.assign(**{group_by_columns[0]: True})

    grouped_by_df = df.groupby(group_by_columns, dropna=False)
    aggregated_cols = []

    if len(step.aggregations) == 0:
        df_result = grouped_by_df.first().reset_index()[group_by_columns]

    else:
        for aggregation in step.aggregations:
            for col, new_col in zip(aggregation.columns, aggregation.new_columns):
                agg_serie = (
                    grouped_by_df[col]
                    .agg(get_aggregate_fn(aggregation.agg_function))
                    .rename(new_col)
                )
                aggregated_cols.append(agg_serie)

        df_result = concat(aggregated_cols, axis=1).reset_index()

    # it is faster this way, than to transform the original df
    if step.keep_original_granularity:
        df_result = df.merge(df_result, on=group_by_columns, how="left")

    # we do not want the pseudo column to ever leave this function
    if len(step.on) == 0:
        del df_result[group_by_columns[0]]
    return df_result
