from pandas import DataFrame, to_datetime
from pandas import __version__ as pd_version

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import DurationStep

_SECOND = 1
_MINUTE = _SECOND * 60
_HOUR = _MINUTE * 60
_DAY = _HOUR * 24

DURATIONS_IN_SECOND = {"seconds": _SECOND, "minutes": _MINUTE, "hours": _HOUR, "days": _DAY}


def execute_duration(
    step: DurationStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    start_date_series = df[step.start_date_column] = to_datetime(df[step.start_date_column])
    end_date_series = df[step.end_date_column] = to_datetime(df[step.end_date_column])
    duration_serie_in_seconds = (end_date_series - start_date_series).astype("timedelta64[s]")
    # in pandas 2, there is a timedelta type, and we want seconds
    if pd_version.startswith("2"):
        duration_serie_in_seconds = duration_serie_in_seconds.dt.total_seconds()
    duration_serie_in_given_unit = duration_serie_in_seconds / DURATIONS_IN_SECOND[step.duration_in]
    return df.assign(**{step.new_column_name: duration_serie_in_given_unit})
