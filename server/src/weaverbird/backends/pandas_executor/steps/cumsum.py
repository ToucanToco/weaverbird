from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import CumSumStep


def execute_cumsum(
    step: CumSumStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    df = df.sort_values(step.reference_column)
    dst_column = step.new_column or f'{step.value_column}_CUMSUM'
    df_grouped = df.groupby(step.groupby, dropna=False) if step.groupby else df
    cumsum_serie = df_grouped[step.value_column].cumsum()
    return df.assign(**{dst_column: cumsum_serie})
