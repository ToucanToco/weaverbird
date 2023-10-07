from pandas import DataFrame, to_datetime

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import FromdurationStep


def execute_fromduration(
    step: FromdurationStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    formatted_duration = to_datetime(df[step.column].dt.total_seconds(), unit="s").dt.strftime(
        step.format
    )
    return df.assign(**{step.column: formatted_duration})
