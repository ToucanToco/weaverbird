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
    df_grouped = df.groupby(step.groupby, dropna=False) if step.groupby else df

    for col in step.to_cumsum:
        dst_column = col[1] or f"{col[0]}_CUMSUM"
        cumsum_serie = df_grouped[col[0]].cumsum()
        df = df.assign(**{dst_column: cumsum_serie})

    return df
