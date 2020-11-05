import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import PivotStep


@pytest.fixture
def sample_df():
    return DataFrame(
        {
            'Label': ['Label 1', 'Label 2', 'Label 3', 'Label 1', 'Label 2', 'Label 3', 'Label 3'],
            'Country': ['Country 1'] * 3 + ['Country 2'] * 4,
            'Value': [13, 7, 20, 1, 10, 5, 1],
        }
    )


def test_pivot(sample_df: DataFrame):
    df_result = PivotStep(
        name='pivot',
        index=['Label'],
        column_to_pivot='Country',
        value_column='Value',
        agg_function='sum',
    ).execute(sample_df)

    expected_result = DataFrame(
        {
            'Label': ['Label 1', 'Label 2', 'Label 3'],
            'Country 1': [13, 7, 20],
            'Country 2': [1, 10, 6],
        }
    )
    assert_dataframes_equals(df_result, expected_result)


def test_pivot_avg(sample_df: DataFrame):
    df_result = PivotStep(
        name='pivot',
        index=['Label'],
        column_to_pivot='Country',
        value_column='Value',
        agg_function='avg',
    ).execute(sample_df)

    expected_result = DataFrame(
        {
            'Label': ['Label 1', 'Label 2', 'Label 3'],
            'Country 1': [13, 7, 20],
            'Country 2': [1, 10, 3],
        }
    )
    assert_dataframes_equals(df_result, expected_result)
