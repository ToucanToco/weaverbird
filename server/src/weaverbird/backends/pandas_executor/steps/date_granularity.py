from pandas import DataFrame, to_datetime, to_timedelta

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import DateGranularityStep


def execute_date_granularity(
    step: DateGranularityStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    granularity = step.granularity
    new_column_name = step.new_column if step.new_column is not None else step.column
    series_dt = to_datetime(df[step.column], utc=True)
    series_dt_accessor = series_dt.dt

    if granularity == "year":
        result = to_datetime(DataFrame({"year": series_dt_accessor.year, "month": 1, "day": 1}))
    elif granularity == "month":
        result = to_datetime(DataFrame({"year": series_dt_accessor.year, "month": series_dt_accessor.month, "day": 1}))
    elif granularity == "week":
        # dayofweek should be between 1 (sunday) and 7 (saturday)
        dayofweek = (series_dt_accessor.dayofweek + 2) % 7
        dayofweek = dayofweek.replace({0: 7})
        # we subtract a number of days corresponding to(dayOfWeek - 1)
        result = series_dt - to_timedelta(dayofweek - 1, unit="d")
        # the result should be returned with 0-ed time information
        result = result.dt.normalize()
    elif granularity == "quarter":
        result = to_datetime(
            DataFrame(
                {
                    "year": series_dt_accessor.year,
                    "month": 3 * ((series_dt_accessor.month - 1) // 3) + 1,
                    "day": 1,
                }
            )
        )
    elif granularity == "isoWeek":
        dayofweek = series_dt_accessor.isocalendar().day
        # we subtract a number of days corresponding to(dayOfWeek - 1)
        result = series_dt - to_timedelta(dayofweek - 1, unit="d")
        # the result should be returned with 0-ed time information
        result = result.dt.normalize()
    elif granularity == "day":
        # the result should be returned with 0-ed time information
        result = series_dt_accessor.normalize()
    else:
        return df

    return df.assign(**{new_column_name: result})
