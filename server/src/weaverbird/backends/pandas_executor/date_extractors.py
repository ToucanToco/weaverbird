from pandas import DataFrame, Series, to_datetime, to_timedelta


def extract_current_day_date(series_dt: Series) -> Series:
    # the result should be returned with 0-ed time information
    return series_dt.dt.normalize()


def extract_first_day_of_iso_week(series_dt: Series) -> Series:
    dayofweek = series_dt.dt.isocalendar().day
    # we subtract a number of days corresponding to(dayOfWeek - 1)
    result = series_dt - to_timedelta(dayofweek - 1, unit="d")
    # the result should be returned with 0-ed time information
    return to_datetime(result.dt.date)


def extract_first_day_of_week(series_dt: Series) -> Series:
    # dayofweek should be between 1 (sunday) and 7 (saturday)
    dayofweek = (series_dt.dt.dayofweek + 2) % 7
    dayofweek = dayofweek.replace({0: 7})
    # we subtract a number of days corresponding to(dayOfWeek - 1)
    result = series_dt - to_timedelta(dayofweek - 1, unit="d")
    # the result should be returned with 0-ed time information
    return to_datetime(result.dt.date)


def extract_first_day_of_month(series_dt: Series) -> Series:
    series_dt_accessor = series_dt.dt
    return to_datetime(DataFrame({"year": series_dt_accessor.year, "month": series_dt_accessor.month, "day": 1}))


def extract_first_day_of_quarter(series_dt: Series) -> Series:
    series_dt_accessor = series_dt.dt
    return to_datetime(
        DataFrame(
            {
                "year": series_dt_accessor.year,
                "month": 3 * ((series_dt_accessor.month - 1) // 3) + 1,
                "day": 1,
            }
        )
    )


def extract_first_day_of_year(series_dt: Series) -> Series:
    return to_datetime(DataFrame({"year": series_dt.dt.year, "month": 1, "day": 1}))
