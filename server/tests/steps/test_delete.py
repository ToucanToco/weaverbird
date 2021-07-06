import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.delete import execute_delete
from weaverbird.pipeline.steps import DeleteStep


@pytest.fixture
def sample_df():
    return DataFrame({'NAME': ['foo', 'bar'], 'AGE': [42, 43], 'SCORE': [100, 200]})


def test_delete(sample_df: DataFrame):
    step = DeleteStep(
        name='delete',
        columns=['NAME', 'SCORE'],
    )
    df_result = execute_delete(step, sample_df)

    expected_result = DataFrame({'AGE': [42, 43]})
    assert_dataframes_equals(df_result, expected_result)


def test_benchmark_delete(benchmark):
    big_df = DataFrame({'value': list(range(1000))})
    step = DeleteStep(
        name='delete',
        columns=['value'],
    )
    benchmark(execute_delete, step, big_df)
