from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.cumsum import execute_cumsum
from weaverbird.pipeline.steps import CumSumStep


def test_cumsum():
    sample_df = DataFrame(
        {
            'date': ['2019-06', '2019-01', '2019-02', '2019-03', '2019-04', '2019-05'],
            'value': [6, 2, 5, 3, 8, 9],
        }
    )

    step = CumSumStep(name='cumsum', valueColumn='value', referenceColumn='date')
    df_result = execute_cumsum(step, sample_df)

    expected_result = DataFrame(
        {
            'date': ['2019-01', '2019-02', '2019-03', '2019-04', '2019-05', '2019-06'],
            'value': [2, 5, 3, 8, 9, 6],
            'value_CUMSUM': [2, 7, 10, 18, 27, 33],
        }
    )
    assert_dataframes_equals(df_result, expected_result)


def test_cumsum_with_groups():
    sample_df = DataFrame(
        {
            'date': ['2019-01', '2019-02', '2019-03', '2019-04', '2019-05', '2019-06'] * 2,
            'country': ['France'] * 6 + ['USA'] * 6,
            'value': [2, 5, 3, 8, 9, 6] + [10, 6, 6, 4, 8, 7],
        }
    )

    step = CumSumStep(
        name='cumsum',
        valueColumn='value',
        referenceColumn='date',
        groupby=['country'],
        newColumn='my_cumsum',
    )
    df_result = execute_cumsum(step, sample_df)

    expected_result = DataFrame(
        {
            'date': ['2019-01', '2019-02', '2019-03', '2019-04', '2019-05', '2019-06'] * 2,
            'country': ['France'] * 6 + ['USA'] * 6,
            'value': [2, 5, 3, 8, 9, 6] + [10, 6, 6, 4, 8, 7],
            'my_cumsum': [2, 7, 10, 18, 27, 33] + [10, 16, 22, 26, 34, 41],
        }
    )
    assert_dataframes_equals(df_result, expected_result.sort_values('date'))


def test_benchmark_cumsum(benchmark):
    big_df = DataFrame({'value': list(range(1000))})
    step = CumSumStep(
        name='cumsum',
        referenceColumn='value',
        valueColumn='value',
        newColumn='my_cumsum',
    )
    benchmark(execute_cumsum, step, big_df)
