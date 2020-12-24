import datetime
from datetime import timedelta

import pandas as pd

from tests.utils import assert_dataframes_equals
from weaverbird.steps.addmissingdates import AddMissingDatesStep


def test_missing_date():
    now = datetime.datetime.today()
    today = datetime.datetime(year=now.year, month=now.month, day=now.day)
    dates = [today + timedelta(days=nb_day) for nb_day in list(range(1, 10)) + list(range(12, 20))]
    missing_dates = [today + timedelta(days=10), today + timedelta(days=11)]

    values = [idx for (idx, value) in enumerate(dates)]
    df = pd.DataFrame(
        {
            'date': [
                today + timedelta(days=nb_day)
                for nb_day in list(range(1, 10)) + list(range(12, 20))
            ],
            'value': values,
        }
    )

    step = AddMissingDatesStep(
        name='addmissingdates', datesColumn='date', granularity='day', groups=[]
    )

    result = step.execute(df)
    expected_result = pd.concat(
        [df, pd.DataFrame({'date': missing_dates, 'value': [None, None]})]
    ).sort_values(by='date')

    assert_dataframes_equals(result, expected_result)


def test_missing_date_with_groups():
    now = datetime.datetime.today()
    today = datetime.datetime(year=now.year, month=now.month, day=now.day)
    dates = [today + timedelta(days=nb_day) for nb_day in list(range(1, 10)) + list(range(12, 20))]
    missing_dates = [today + timedelta(days=10), today + timedelta(days=11)]

    values = [idx for (idx, value) in enumerate(dates)]
    df = pd.DataFrame(
        {
            'date': dates * 2,
            'country': ['France'] * len(dates) + ['USA'] * len(dates),
            'value': values * 2,
        }
    )
    print(df)
    step = AddMissingDatesStep(
        name='addmissingdates', datesColumn='date', granularity='day', groups=['country']
    )
    result = step.execute(df)
    expected_result = pd.concat(
        [
            df,
            pd.DataFrame(
                {
                    'country': ['France'] * 2 + ['USA'] * 2,
                    'date': missing_dates * 2,
                    'value': [None, None] * 2,
                }
            ),
        ]
    ).sort_values(by=['country', 'date'])
    assert_dataframes_equals(result, expected_result)
