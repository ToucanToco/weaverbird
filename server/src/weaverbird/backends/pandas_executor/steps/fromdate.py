from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import FromdateStep


def execute_fromdate(
    step: FromdateStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    formatted_time = df[step.column].dt.strftime(step.format)
    return df.assign(**{step.column: formatted_time})
