import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import DeleteStep


@pytest.fixture
def sample_df():
    return DataFrame({'NAME': ['foo', 'bar'], 'AGE': [42, 43], 'SCORE': [100, 200]})


def test_delete(sample_df: DataFrame):
    df_result = DeleteStep(
        name='delete',
        columns=['NAME', 'SCORE'],
    ).execute(sample_df)

    expected_result = DataFrame({'AGE': [42, 43]})
    assert_dataframes_equals(df_result, expected_result)
