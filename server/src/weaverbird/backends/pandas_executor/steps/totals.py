from pandas import DataFrame, concat

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import AggregateStep, TotalsStep
from weaverbird.pipeline.steps.totals import TotalDimension

from .aggregate import execute_aggregate


def get_total_for_dimension(
    step: TotalsStep, df: DataFrame, total_dimension: TotalDimension, dimensions_to_skip: list
) -> DataFrame:
    # get all group_by columns: all total_dimensions, except the current one + groups
    # all columns that are either not aggregated, or groups, or total will be null
    group_by_columns = step.groups + [
        group_column.total_column
        for group_column in step.total_dimensions
        if group_column != total_dimension
    ]
    aggregations = []
    for aggregation in step.aggregations:
        agg = aggregation.copy()
        agg.columns = agg.new_columns
        aggregations.append(agg)

    aggregation_step = AggregateStep(
        name='aggregate',
        keepOriginalGranularity=False,
        aggregations=aggregations,
        on=group_by_columns,
    )
    aggregated_df = execute_aggregate(aggregation_step, df)

    aggregated_df[total_dimension.total_column] = total_dimension.total_rows_label
    full_aggregation = aggregated_df.copy()
    # if we are the last dimension, we already computed all combinations
    if total_dimension != step.total_dimensions[-1]:
        for dimension in step.total_dimensions[step.total_dimensions.index(total_dimension) :]:
            if dimension not in dimensions_to_skip and dimension != total_dimension:
                full_aggregation = concat(
                    [
                        full_aggregation,
                        get_total_for_dimension(
                            step, aggregated_df, dimension, dimensions_to_skip + [dimension]
                        ),
                    ]
                )
    return full_aggregation


def get_total_for_dimensions(step: TotalsStep, df: DataFrame) -> DataFrame:
    group_by_columns = step.groups + [dim.total_column for dim in step.total_dimensions]

    aggregation_step = AggregateStep(
        name='aggregate',
        keepOriginalGranularity=False,
        aggregations=step.aggregations,
        on=group_by_columns,
    )
    aggregated_df = execute_aggregate(aggregation_step, df)

    result_df = DataFrame()
    for dimension in step.total_dimensions:
        result_df = concat([result_df, get_total_for_dimension(step, aggregated_df, dimension, [])])
    return result_df


def execute_totals(
    step: TotalsStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    total_rows = []
    # for total_dimension in step.total_dimensions:
    total_rows.append(get_total_for_dimensions(step, df))

    # rename columns in the base df, so it will match with the total in schema
    col_to_rm = set()
    for aggregation in step.aggregations:
        for col, new_col in zip(aggregation.columns, aggregation.new_columns):
            if col != new_col:
                df[new_col] = df[col]
                col_to_rm.add(col)
    for col in col_to_rm:
        del df[col]

    result = concat([df] + total_rows)
    return result
