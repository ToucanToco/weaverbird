import datetime
import random

import numpy as np
import pytest
from pandas import DataFrame, Timestamp

from tests.utils import assert_dataframes_equals
from weaverbird.steps import ToDateStep


@pytest.fixture
def sample_df():
    return DataFrame({'a_date': ['06/10/2019', '07/10/2019', '08/10/2019', None]})


def test_todate(sample_df: DataFrame):
    step = ToDateStep(name='todate', column='a_date', format='%d/%m/%Y')
    result = step.execute(sample_df)
    assert_dataframes_equals(
        result,
        DataFrame(
            {
                'a_date': [
                    Timestamp(year=2019, month=10, day=6),
                    Timestamp(year=2019, month=10, day=7),
                    Timestamp(year=2019, month=10, day=8),
                    None,
                ]
            }
        ),
    )


def test_todate_automatic_guess(sample_df: DataFrame):
    step = ToDateStep(name='todate', column='a_date')
    result = step.execute(sample_df)
    assert_dataframes_equals(
        result,
        DataFrame(
            {
                'a_date': [
                    # Pandas thinks the format is '%m/%d/%Y':
                    Timestamp(year=2019, month=6, day=10),
                    Timestamp(year=2019, month=7, day=10),
                    Timestamp(year=2019, month=8, day=10),
                    None,
                ]
            }
        ),
    )


def test_benchmark_sort(benchmark):
    now = datetime.datetime.today()
    today = datetime.datetime(year=now.year, month=now.month, day=now.day)
    groups = ['group_1', 'group_2']
    df = DataFrame(
        {
            'value': np.random.random(1000),
            'id': list(range(1000)),
            'date': [
                (today + datetime.timedelta(days=nb_day)).strftime('%Y-%m-%d')
                for nb_day in list(range(1000))
            ],
            'group': [random.choice(groups) for _ in range(1000)],
        }
    )

    step = ToDateStep(name='todate', column='date')

    benchmark(step.execute, df)
