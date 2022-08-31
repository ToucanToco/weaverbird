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
    timestamp_unit = None

    if format is None and df[step.column].dtype == "int64":
        # By default int are understood as timestamps, we prefer to convert it to %Y format if values are < 10_000
        if df[step.column].max() < 10_000:
            format = "%Y"
        else:
            # Timestamps are expected in ms (not in ns, which is pandas' default)
            timestamp_unit = "ms"

    datetime_serie = to_datetime(
        df[step.column], format=format, errors="coerce", unit=timestamp_unit
    )
    return df.assign(**{step.column: datetime_serie})
