from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import DuplicateStep


def test_duplicate():
    input_df = DataFrame({'x': [100, 200]})
    df_result = DuplicateStep(name='duplicate', column='x', new_column_name='y').execute(input_df)
    expected_result = DataFrame({'x': [100, 200], 'y': [100, 200]})
    assert_dataframes_equals(df_result, expected_result)


def test_benchmark_duplicate(benchmark):
    big_df = DataFrame({'value': list(range(1000))})
    step = DuplicateStep(name='duplicate', column='value', new_column_name='y')
    benchmark(step.execute, big_df)
