from pandas import DataFrame, to_datetime

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import ToDateStep


def execute_todate(
    step: ToDateStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    format = step.format
    timestamp_unit = 'ms' if df[step.column].dtype == 'int64' else None
    # By default int are understood as timestamps, we prefer to convert it to %Y format if values are < 10_000
    if format is None and df[step.column].dtype == 'int64' and df[step.column].max() < 10_000:
        format = '%Y'
        timestamp_unit = None

    datetime_serie = to_datetime(
        df[step.column], format=format, errors='coerce', unit=timestamp_unit
    )
    return df.assign(**{step.column: datetime_serie})
