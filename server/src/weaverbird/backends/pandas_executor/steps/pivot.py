from numpy import nan as nan_value
from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import PivotStep

PIVOT_NULL_VALUE = "__WEAVERBIRD_PIVOT_NULL_VALUE__"


def execute_pivot(
    step: PivotStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    # Create alias for null values in indexed columns before running pivot to avoid removing null values
    for idx_column in step.index:
        df[idx_column] = df[idx_column].fillna(PIVOT_NULL_VALUE)
    df[PIVOT_NULL_VALUE] = nan_value

    pivoted_df = df.pivot_table(
        values=step.value_column,
        index=step.index,
        columns=step.column_to_pivot,
        aggfunc="mean" if step.agg_function == "avg" else step.agg_function,
    ).reset_index()

    # Replace alias with null value
    for idx_column in step.index:
        pivoted_df[idx_column] = pivoted_df[idx_column].replace(PIVOT_NULL_VALUE, nan_value)

    pivoted_df.columns.name = None
    return pivoted_df
