import operator
from datetime import datetime

from dateutil.relativedelta import relativedelta
from pandas import DataFrame, to_datetime, to_timedelta

from weaverbird.pipeline.dates import RelativeDate


def evaluate_relative_date(relative_date: RelativeDate) -> datetime:
    """
    From a RelativeDate definition, compute the actual corresponding datetime.
    """
    if relative_date.operator == "until":
        operation = operator.sub
    elif relative_date.operator == "from":
        operation = operator.add
    else:
        raise NotImplementedError

    if relative_date.duration == "quarter":
        quantity = relative_date.quantity * 3
        duration = "months"
    else:
        quantity = relative_date.quantity
        duration = relative_date.duration + "s"

    return operation(relative_date.date, relativedelta(**{duration: quantity}))


def extract_current_day_date(series_dt_accessor):
    # the result should be returned with 0-ed time information
    return series_dt_accessor.normalize()


def extract_first_day_of_iso_week(series_dt, series_dt_accessor):
    dayofweek = series_dt_accessor.isocalendar().day
    # we subtract a number of days corresponding to(dayOfWeek - 1)
    result = series_dt - to_timedelta(dayofweek - 1, unit="d")
    # the result should be returned with 0-ed time information
    return to_datetime(result.dt.date)


def extract_first_day_of_week(series_dt, series_dt_accessor):
    # dayofweek should be between 1 (sunday) and 7 (saturday)
    dayofweek = (series_dt_accessor.dayofweek + 2) % 7
    dayofweek = dayofweek.replace({0: 7})
    # we subtract a number of days corresponding to(dayOfWeek - 1)
    result = series_dt - to_timedelta(dayofweek - 1, unit="d")
    # the result should be returned with 0-ed time information
    return to_datetime(result.dt.date)


def extract_first_day_of_month(series_dt_accessor):
    return to_datetime(DataFrame({"year": series_dt_accessor.year, "month": series_dt_accessor.month, "day": 1}))


def extract_first_day_of_quarter(series_dt_accessor):
    return to_datetime(
        DataFrame(
            {
                "year": series_dt_accessor.year,
                "month": 3 * ((series_dt_accessor.month - 1) // 3) + 1,
                "day": 1,
            }
        )
    )


def extract_first_day_of_year(series_dt_accessor):
    return to_datetime(DataFrame({"year": series_dt_accessor.year, "month": 1, "day": 1}))
