from pandas import DataFrame, to_datetime

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import ToDateStep


def execute_todate(
    step: ToDateStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    datetime_serie = to_datetime(df[step.column], format=step.format, errors='coerce')
    return df.assign(**{step.column: datetime_serie})
