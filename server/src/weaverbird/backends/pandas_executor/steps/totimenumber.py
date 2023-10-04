from pandas import DataFrame, to_timedelta

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import ToTimeNumberStep


def execute_totimenumber(
    step: ToTimeNumberStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    time_serie = to_timedelta(df[step.column], errors="coerce", unit=step.unit)
    return df.assign(**{step.column: time_serie})
