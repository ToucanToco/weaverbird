from datetime import datetime

from pandas import DataFrame, to_datetime

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import ToTimeTextStep


def execute_totimetext(
    step: ToTimeTextStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    time_serie = to_datetime(df[step.column], errors="coerce", format=step.format) - datetime(
        1900, 1, 1
    )
    return df.assign(**{step.column: time_serie})
