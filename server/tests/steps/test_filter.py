import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.filter import execute_filter
from weaverbird.pipeline.conditions import ComparisonCondition
from weaverbird.pipeline.steps import FilterStep


@pytest.fixture
def sample_df():
    return DataFrame({'colA': ['toto', 'tutu', 'tata'], 'colB': [1, 2, 3], 'colC': [100, 50, 25]})


@pytest.mark.parametrize('value', [0, False, True, 0.0, 1, 1.5, '', '0', None, [], [0], '0.0'])
def test_simple_condition_valid_values(value) -> None:
    # Ensure pydantic cast does not change types for `value` field:
    sc = ComparisonCondition(column='x', operator='eq', value=value)
    result_value = sc.value
    assert value == result_value
    assert type(value) == type(result_value)


def test_simple_eq_filter(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'column': 'colA',
            'operator': 'eq',
            'value': 'tutu',
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({'colA': ['tutu'], 'colB': [2], 'colC': [50]}))


def test_simple_ne_filter(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'column': 'colA',
            'operator': 'ne',
            'value': 'tutu',
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(
        df_result, DataFrame({'colA': ['toto', 'tata'], 'colB': [1, 3], 'colC': [100, 25]})
    )


def test_simple_gt_filter(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'column': 'colB',
            'operator': 'gt',
            'value': 2,
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({'colA': ['tata'], 'colB': [3], 'colC': [25]}))


def test_simple_ge_filter(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'column': 'colB',
            'operator': 'ge',
            'value': 2,
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(
        df_result, DataFrame({'colA': ['tutu', 'tata'], 'colB': [2, 3], 'colC': [50, 25]})
    )


def test_simple_lt_filter(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'column': 'colB',
            'operator': 'lt',
            'value': 2,
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({'colA': ['toto'], 'colB': [1], 'colC': [100]}))


def test_simple_le_filter(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'column': 'colB',
            'operator': 'le',
            'value': 2,
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(
        df_result, DataFrame({'colA': ['toto', 'tutu'], 'colB': [1, 2], 'colC': [100, 50]})
    )


def test_simple_in_filter(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'column': 'colA',
            'operator': 'in',
            'value': ['toto', 'tutu'],
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(
        df_result, DataFrame({'colA': ['toto', 'tutu'], 'colB': [1, 2], 'colC': [100, 50]})
    )


def test_simple_nin_filter(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'column': 'colA',
            'operator': 'nin',
            'value': ['toto', 'tutu'],
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({'colA': ['tata'], 'colB': [3], 'colC': [25]}))


def test_simple_null_filter(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'column': 'colA',
            'operator': 'isnull',
        },
    )
    df_result = execute_filter(step, sample_df)

    assert df_result.empty


def test_simple_notnull_filter(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'column': 'colA',
            'operator': 'notnull',
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, sample_df)


def test_simple_matches_filter(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'column': 'colA',
            'operator': 'matches',
            'value': 'a.a',
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({'colA': ['tata'], 'colB': [3], 'colC': [25]}))


def test_simple_notmatches_filter(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'column': 'colA',
            'operator': 'notmatches',
            'value': 'a.a',
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(
        df_result, DataFrame({'colA': ['toto', 'tutu'], 'colB': [1, 2], 'colC': [100, 50]})
    )


def test_and_logical_conditions(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'and': [
                {
                    'column': 'colB',
                    'operator': 'le',
                    'value': 2,
                },
                {
                    'column': 'colC',
                    'operator': 'gt',
                    'value': 75,
                },
            ]
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({'colA': ['toto'], 'colB': [1], 'colC': [100]}))


def test_or_logical_conditions(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'or': [
                {
                    'column': 'colA',
                    'operator': 'eq',
                    'value': 'toto',
                },
                {
                    'column': 'colC',
                    'operator': 'lt',
                    'value': 33,
                },
            ]
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(
        df_result, DataFrame({'colA': ['toto', 'tata'], 'colB': [1, 3], 'colC': [100, 25]})
    )


def test_nested_logical_conditions(sample_df):
    step = FilterStep(
        name='filter',
        condition={
            'and': [
                {
                    'or': [
                        {
                            'column': 'colA',
                            'operator': 'eq',
                            'value': 'toto',
                        },
                        {
                            'column': 'colC',
                            'operator': 'lt',
                            'value': 33,
                        },
                    ]
                },
                {'column': 'colB', 'operator': 'gt', 'value': 2},
            ]
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({'colA': ['tata'], 'colB': [3], 'colC': [25]}))


def test_benchmark_filter(benchmark):
    big_df = DataFrame({'value': list(range(1000))})
    step = FilterStep(name='filter', condition={'column': 'value', 'operator': 'lt', 'value': 20})
    result = benchmark(execute_filter, step, big_df)
    assert len(result) == 20
