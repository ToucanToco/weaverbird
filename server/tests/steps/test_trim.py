import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.trim import execute_trim
from weaverbird.pipeline.steps import TrimStep


@pytest.fixture
def sample_df() -> DataFrame:
    return DataFrame(
        {
            'ColA': [' foo ', ' bar '],
            'ColB': [' toto ', ' tata '],
        }
    )


def test_trim_single_colum(sample_df: DataFrame):
    step = TrimStep(name='trim', columns=['ColA'])
    df_result = execute_trim(step, sample_df)

    expected_result = DataFrame(
        {
            'ColA': ['foo', 'bar'],
            'ColB': [' toto ', ' tata '],
        }
    )
    assert_dataframes_equals(df_result, expected_result)


def test_trim_multiple_colums(sample_df: DataFrame):
    step = TrimStep(name='trim', columns=['ColA', 'ColB'])
    df_result = execute_trim(step, sample_df)

    expected_result = DataFrame(
        {
            'ColA': ['foo', 'bar'],
            'ColB': ['toto', 'tata'],
        }
    )
    assert_dataframes_equals(df_result, expected_result)
