import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import StatisticsStep


@pytest.fixture
def sample_df():
    return DataFrame(
        {
            'Label': ['Label 1', 'Label 2', 'Label 3', 'Label 4', 'Label 5', 'Label 6'],
            'Group': ['Group 1'] * 3 + ['Group 2'] * 3,
            'Value': [13, 7, 20, 1, 10, 5],
        }
    )


def test_statistics(sample_df: DataFrame):
    df_result = StatisticsStep(
        name='statistics',
        column='Value',
        groupby_columns=[],
        statistics=['average', 'count'],
        quantiles=[{'label': 'median', 'nth': 1, 'order': 2}],
    ).execute(sample_df)

    expected_result = DataFrame({'average': [9.33333], 'count': [6], 'median': [8.5]})
    assert_dataframes_equals(df_result, expected_result)


def test_statistics_with_groups(sample_df: DataFrame):
    df_result = StatisticsStep(
        name='statistics',
        column='Value',
        groupby_columns=['Group'],
        statistics=['average', 'count'],
        quantiles=[{'label': 'median', 'nth': 1, 'order': 2}],
    ).execute(sample_df)

    expected_result = DataFrame(
        {
            'Group': ['Group 1', 'Group 2'],
            'average': [13.33333, 5.33333],
            'count': [3, 3],
            'median': [13, 5],
        }
    )
    assert_dataframes_equals(df_result, expected_result)
