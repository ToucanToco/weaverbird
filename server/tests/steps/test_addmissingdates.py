import datetime
import random
from datetime import timedelta
from typing import Any, cast

import pandas as pd
import pytest
from weaverbird.backends.pandas_executor.steps.addmissingdates import execute_addmissingdates
from weaverbird.pipeline.steps import AddMissingDatesStep

from tests.utils import assert_dataframes_equals


@pytest.fixture()
def today():
    now = datetime.datetime.today()
    return datetime.datetime(year=now.year, month=now.month, day=now.day)


def test_missing_date(today):
    dates = [today + timedelta(days=nb_day) for nb_day in list(range(1, 10)) + list(range(12, 20))]
    missing_dates = [today + timedelta(days=10), today + timedelta(days=11)]

    values = [idx for (idx, value) in enumerate(dates)]
    df = pd.DataFrame(
        {
            "date": dates,
            "value": values,
        }
    )

    step = AddMissingDatesStep(
        name="addmissingdates", datesColumn="date", datesGranularity="day", groups=[]
    )

    result = execute_addmissingdates(step, df)
    expected_result = pd.concat(
        [df, pd.DataFrame({"date": missing_dates, "value": [None, None]})]
    ).sort_values(by="date")

    assert_dataframes_equals(result, expected_result)


def test_missing_date_years(today):
    dates = [
        today + timedelta(days=nb_years * 365)
        for nb_years in list(range(1, 10)) + list(range(12, 20))
    ]
    missing_dates = [today + timedelta(days=10 * 365), today + timedelta(days=11 * 365)]

    # dates added by pandas are at the beginning of the last day of the year
    missing_dates = [
        datetime.datetime(year=missing_date.year, month=1, day=1) for missing_date in missing_dates
    ]
    values = [idx for (idx, value) in enumerate(dates)]

    df = pd.DataFrame(
        {
            "date": dates,
            "value": values,
        }
    )

    step = AddMissingDatesStep(
        name="addmissingdates", datesColumn="date", datesGranularity="year", groups=[]
    )

    result = execute_addmissingdates(step, df)
    expected_result = pd.concat(
        [df, pd.DataFrame({"date": missing_dates, "value": [None, None]})]
    ).sort_values(by="date")

    assert_dataframes_equals(result, expected_result)


def test_missing_date_with_groups_correct_indexing(today):
    """
    It should not create duplicate values in index
    """
    dates = [today + timedelta(days=nb_day) for nb_day in list(range(1, 10)) + list(range(12, 20))]
    missing_dates = [today + timedelta(days=10), today + timedelta(days=11)]

    values = [idx for (idx, value) in enumerate(dates)]
    df = pd.DataFrame(
        {
            "date": dates * 2,
            "country": ["France"] * len(dates) + ["USA"] * len(dates),
            "value": values * 2,
        }
    )

    step = AddMissingDatesStep(
        name="addmissingdates", datesColumn="date", datesGranularity="day", groups=["country"]
    )
    result = execute_addmissingdates(step, df)
    expected_result = pd.concat(
        [
            df,
            pd.DataFrame(
                {
                    "country": cast(list[Any], ["France"] * 2 + ["USA"] * 2),
                    "date": missing_dates * 2,
                    "value": [None, None] * 2,
                }
            ),
        ]
    ).sort_values(by=["country", "date"])
    assert_dataframes_equals(result, expected_result)
    assert not result.index.has_duplicates


def test_missing_date_with_groups_various_length(today):
    dates = [
        datetime.datetime(year=2020, month=nb_month, day=1)
        for nb_month in list(range(1, 5)) + list(range(8, 10))
    ]

    missing_dates = [datetime.datetime(year=2020, month=nb_month, day=1) for nb_month in [5, 6, 7]]

    values = [idx for (idx, value) in enumerate(dates)]
    df = pd.DataFrame(
        {
            "date": dates + dates[0:-1],
            "country": ["France"] * len(dates) + ["USA"] * (len(dates) - 1),
            "value": values + values[0:-1],
        }
    )

    step = AddMissingDatesStep(
        name="addmissingdates", datesColumn="date", datesGranularity="month", groups=["country"]
    )
    result = execute_addmissingdates(step, df)
    expected_result = pd.concat(
        [
            df,
            pd.DataFrame(
                {
                    "country": cast(
                        list[Any],
                        ["France"] * len(missing_dates) + ["USA"] * len(missing_dates),
                    ),
                    "date": missing_dates * 2,
                    "value": [None] * len(missing_dates) * 2,
                }
            ),
        ]
    ).sort_values(by=["country", "date"])
    assert_dataframes_equals(result, expected_result)


def test_benchmark_addmissingdate(benchmark, today):
    dates = [today + timedelta(days=nb_day) for nb_day in list(range(1, 2001))]
    # we remove 100 random days, but not at the edges
    idx_to_remove = [random.randint(50, 1500) for _ in range(100)]
    for idx in idx_to_remove:
        del dates[idx]

    assert len(dates) == 1900

    values = [idx for (idx, value) in enumerate(dates)]
    df = pd.DataFrame(
        {
            "date": dates,
            "value": values,
        }
    )

    step = AddMissingDatesStep(
        name="addmissingdates", datesColumn="date", datesGranularity="day", groups=[]
    )

    result = benchmark(execute_addmissingdates, step, df)
    assert len(result) == 2000


def test_add_missing_dates_with_tz_aware_timestamps():
    df = pd.DataFrame(
        {
            "date": [
                # These both forms should result in objects with exactly the same shape,
                # i.e. Timestamp('2022-12-0{7,9} 00:00:00+0000', tz='UTC'), but who knows which kind
                # of changes will happen with the Timestamp class
                pd.Timestamp("2022-12-07T00:00:00+00:00"),
                pd.Timestamp("2022-12-09T00:00:00", tz="UTC"),
            ],
            "value": [1.2, 2.3],
        }
    )

    expected_result = pd.DataFrame(
        {
            "date": [
                pd.Timestamp("2022-12-07T00:00:00", tz="UTC"),
                pd.Timestamp("2022-12-08T00:00:00", tz="UTC"),
                pd.Timestamp("2022-12-09T00:00:00", tz="UTC"),
            ],
            "value": [1.2, None, 2.3],
        }
    )

    step = AddMissingDatesStep(
        name="addmissingdates", dates_column="date", dates_granularity="day", groups=[]
    )
    result = execute_addmissingdates(step, df)

    assert_dataframes_equals(result, expected_result)
    assert isinstance(result["date"][1], pd.Timestamp)
    assert result["date"].dtype.name.startswith("datetime64")
