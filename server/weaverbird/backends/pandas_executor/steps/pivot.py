from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import PivotStep


def execute_pivot(
    step: PivotStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    pivoted_df = df.pivot_table(
        values=step.value_column,
        index=step.index,
        columns=step.column_to_pivot,
        aggfunc='mean' if step.agg_function == 'avg' else step.agg_function,
    ).reset_index()
    pivoted_df.columns.name = None
    return pivoted_df
