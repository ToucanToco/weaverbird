from typing import get_args

from pandas import DataFrame, to_datetime, to_timedelta
from pandas.api.types import is_unsigned_integer_dtype

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import DateExtractStep
from weaverbird.pipeline.steps.date_extract import DATE_INFO, TIMESTAMP_DATE_PARTS

from .utils.cast import cast_to_int

OPERATIONS_MAPPING = {
    "minutes": "minute",
    "seconds": "second",
    "dayOfYear": "dayofyear",
}


def execute_date_extract(
    step: DateExtractStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    date_info: list[DATE_INFO]
    if step.operation:  # for retrocompatibility
        date_info = [step.operation]
        new_columns = [step.new_column_name or f"{step.column}_{step.operation}"]
    else:
        date_info = step.date_info
        new_columns = step.new_columns

    for dt_info, new_col in zip(date_info, new_columns):
        series_dt = to_datetime(df[step.column], utc=True)
        series_dt_accessor = series_dt.dt
        if dt_info == "week":
            # cast in float and not in int to manage NaN properly
            result = series_dt_accessor.strftime("%U").astype(float)
        elif dt_info == "dayOfWeek":
            # result should be between 1 (sunday) and 7 (saturday)
            result = (series_dt_accessor.dayofweek + 2) % 7
            result = result.replace({0: 7})
        elif dt_info == "isoYear":
            result = series_dt_accessor.isocalendar().year
        elif dt_info == "isoWeek":
            result = series_dt_accessor.isocalendar().week
        elif dt_info == "isoDayOfWeek":
            result = series_dt_accessor.isocalendar().day
        elif dt_info == "firstDayOfYear":
            result = to_datetime(DataFrame({"year": series_dt_accessor.year, "month": 1, "day": 1}))
        elif dt_info == "firstDayOfMonth":
            result = to_datetime(
                DataFrame(
                    {"year": series_dt_accessor.year, "month": series_dt_accessor.month, "day": 1}
                )
            )
        elif dt_info == "firstDayOfWeek":
            # dayofweek should be between 1 (sunday) and 7 (saturday)
            dayofweek = (series_dt_accessor.dayofweek + 2) % 7
            dayofweek = dayofweek.replace({0: 7})
            # we subtract a number of days corresponding to(dayOfWeek - 1)
            result = series_dt - to_timedelta(dayofweek - 1, unit="d")
            # the result should be returned with 0-ed time information
            result = to_datetime(result.dt.date)
        elif dt_info == "firstDayOfQuarter":
            result = to_datetime(
                DataFrame(
                    {
                        "year": series_dt_accessor.year,
                        "month": 3 * ((series_dt_accessor.month - 1) // 3) + 1,
                        "day": 1,
                    }
                )
            )
        elif dt_info == "firstDayOfIsoWeek":
            dayofweek = series_dt_accessor.isocalendar().day
            # we subtract a number of days corresponding to(dayOfWeek - 1)
            result = series_dt - to_timedelta(dayofweek - 1, unit="d")
            # the result should be returned with 0-ed time information
            result = to_datetime(result.dt.date)
        elif dt_info == "previousDay":
            result = series_dt - to_timedelta(1, unit="d")
            # the result should be returned with 0-ed time information
            result = to_datetime(result.dt.date)
        elif dt_info == "firstDayOfPreviousYear":
            result = to_datetime(
                DataFrame({"year": series_dt_accessor.year - 1, "month": 1, "day": 1})
            )
        elif dt_info == "firstDayOfPreviousMonth":
            prev_month = series_dt_accessor.month - 1
            prev_month = prev_month.replace({0: 12})
            result = to_datetime(
                DataFrame(
                    {
                        "year": series_dt_accessor.year - (prev_month == 12),
                        "month": prev_month,
                        "day": 1,
                    }
                )
            )
        elif dt_info == "firstDayOfPreviousWeek":
            prev_week_date = series_dt - to_timedelta(7, unit="d")
            # dayofweek should be between 1 (sunday) and 7 (saturday)
            dayofweek = (prev_week_date.dt.dayofweek + 2) % 7
            dayofweek = dayofweek.replace({0: 7})
            # we subtract a number of days corresponding to(dayOfWeek - 1)
            result = prev_week_date - to_timedelta(dayofweek - 1, unit="d")
            # the result should be returned with 0-ed time information
            result = to_datetime(result.dt.date)
        elif dt_info == "firstDayOfPreviousQuarter":
            first_month_of_quarter = 3 * ((series_dt_accessor.month - 1) // 3) + 1
            first_month_of_prev_q = first_month_of_quarter - 3
            first_month_of_prev_q = first_month_of_prev_q.replace({-2: 10})
            result = to_datetime(
                DataFrame(
                    {
                        "year": series_dt_accessor.year - (first_month_of_prev_q == 10),
                        "month": first_month_of_prev_q,
                        "day": 1,
                    }
                )
            )
        elif dt_info == "firstDayOfPreviousIsoWeek":
            prev_week_date = series_dt - to_timedelta(7, unit="d")
            dayofweek = prev_week_date.dt.isocalendar().day
            # we subtract a number of days corresponding to(dayOfWeek - 1)
            result = prev_week_date - to_timedelta(dayofweek - 1, unit="d")
            # the result should be returned with 0-ed time information
            result = to_datetime(result.dt.date)
        elif dt_info == "previousYear":
            result = series_dt_accessor.year - 1
        elif dt_info == "previousMonth":
            month = series_dt_accessor.month
            result = month - 1
            result = result.replace({0: 12})
        elif dt_info == "previousWeek":
            prev_week_date = series_dt - to_timedelta(7, unit="d")
            result = prev_week_date.dt.strftime("%U").astype(float)
        elif dt_info == "previousQuarter":
            result = series_dt_accessor.quarter - 1
            result = result.replace({0: 4})
        elif dt_info == "previousIsoWeek":
            prev_week_date = series_dt - to_timedelta(7, unit="d")
            result = prev_week_date.dt.isocalendar().week
        elif dt_info == "milliseconds":
            result = series_dt_accessor.microsecond / 1000
        else:
            operation = OPERATIONS_MAPPING.get(dt_info, dt_info)
            result = getattr(series_dt_accessor, operation)

        # Handle unsigned integers:
        if is_unsigned_integer_dtype(result) or dt_info not in get_args(TIMESTAMP_DATE_PARTS):
            result = cast_to_int(result)

        df = df.assign(**{new_col: result})

    return df
