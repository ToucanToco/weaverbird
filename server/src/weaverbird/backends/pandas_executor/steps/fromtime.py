from pandas import DataFrame, to_datetime

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import FromtimeStep


def execute_fromtime(
    step: FromtimeStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    formatted_time = to_datetime(df[step.column].dt.total_seconds(), unit="s").dt.strftime(
        step.format
    )
    return df.assign(**{step.column: formatted_time})
