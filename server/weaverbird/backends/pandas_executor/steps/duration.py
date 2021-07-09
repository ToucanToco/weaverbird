from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import DurationStep

_SECOND = 1
_MINUTE = _SECOND * 60
_HOUR = _MINUTE * 60
_DAY = _HOUR * 24

DURATIONS_IN_SECOND = {'seconds': _SECOND, 'minutes': _MINUTE, 'hours': _HOUR, 'days': _DAY}


def execute_duration(
    step: DurationStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    duration_serie_in_seconds = (df[step.end_date_column] - df[step.start_date_column]).astype(
        'timedelta64[s]'
    )
    duration_serie_in_given_unit = duration_serie_in_seconds / DURATIONS_IN_SECOND[step.duration_in]
    return df.assign(**{step.new_column_name: duration_serie_in_given_unit})
