import pandas as pd
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import MovingAverageStep


def test_moving_average_basic():
    df = DataFrame(
        {'date': [f'2018-01-0{i}' for i in range(1, 9)], 'value': [75, 80, 82, 83, 80, 86, 79, 76]}
    )
    df['date'] = pd.to_datetime(df['date'])

    df_result = MovingAverageStep(
        name='movingaverage',
        valueColumn='value',
        columnToSort='date',
        movingWindow=2,
    ).execute(df)

    expected_result = df.assign(
        **{'value_MOVING_AVG': [None, 77.5, 81, 82.5, 81.5, 83, 82.5, 77.5]}
    )
    assert_dataframes_equals(df_result, expected_result)


def test_moving_average_with_groups():
    df = DataFrame(
        {
            'country': ['France'] * 6 + ['USA'] * 6,
            'date': [f'2018-01-0{i}' for i in range(1, 7)] * 2,
            'value': [75, 80, 82, 83, 80, 86] + [69, 73, 73, 75, 70, 76],
        }
    )
    df['date'] = pd.to_datetime(df['date'])

    df_result = MovingAverageStep(
        name='movingaverage',
        valueColumn='value',
        columnToSort='date',
        movingWindow=3,
        groups=['country'],
        newColumnName='rolling_average',
    ).execute(df)

    expected_result = df.assign(
        **{
            'rolling_average': [None, None, 79, 81.6667, 81.6667, 83]
            + [None, None, 71.6667, 73.6667, 72.6667, 73.6667]
        }
    )
    assert_dataframes_equals(df_result, expected_result)
