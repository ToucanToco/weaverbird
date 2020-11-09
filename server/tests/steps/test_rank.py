import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import RankStep


@pytest.fixture
def sample_df():
    return DataFrame(
        {'COUNTRY': ['France'] * 3 + ['USA'] * 4, 'VALUE': [10, 20, 30, 10, 40, 30, 50]}
    )


def test_rank(sample_df: DataFrame):
    df_result = RankStep(
        name='rank',
        value_col='VALUE',
        order='asc',
        method='standard',
    ).execute(sample_df)

    expected_result = DataFrame(
        {
            'COUNTRY': ['France', 'USA', 'France', 'France', 'USA', 'USA', 'USA'],
            'VALUE': [10, 10, 20, 30, 30, 40, 50],
            'VALUE_RANK': [1, 1, 3, 4, 4, 6, 7],
        }
    )
    assert_dataframes_equals(df_result, expected_result)


def test_rank_with_groups(sample_df: DataFrame):
    df_result = RankStep(
        name='rank',
        value_col='VALUE',
        groupby=['COUNTRY'],
        order='desc',
        method='dense',
        new_column_name='rank',
    ).execute(sample_df)

    expected_result = DataFrame(
        {
            'COUNTRY': ['France', 'USA', 'France', 'USA', 'France', 'USA', 'USA'],
            'VALUE': [30, 50, 20, 40, 10, 30, 10],
            'rank': [1, 1, 2, 2, 3, 3, 4],
        }
    )
    assert_dataframes_equals(df_result, expected_result)
