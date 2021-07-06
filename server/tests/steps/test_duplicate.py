from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.duplicate import execute_duplicate
from weaverbird.pipeline.steps import DuplicateStep


def test_duplicate():
    input_df = DataFrame({'x': [100, 200]})
    step = DuplicateStep(name='duplicate', column='x', new_column_name='y')
    df_result = execute_duplicate(step, input_df)
    expected_result = DataFrame({'x': [100, 200], 'y': [100, 200]})
    assert_dataframes_equals(df_result, expected_result)


def test_benchmark_duplicate(benchmark):
    big_df = DataFrame({'value': list(range(1000))})
    step = DuplicateStep(name='duplicate', column='value', new_column_name='y')
    benchmark(execute_duplicate, step, big_df)
