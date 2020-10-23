import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import FilterStep


@pytest.fixture
def sample_df():
    return DataFrame({'colA': ['toto', 'tutu', 'tata'], 'colB': [1, 2, 3], 'colC': [100, 50, 25]})


def test_simple_eq_filter(sample_df):
    df_result = FilterStep(
        name='filter',
        condition={
            'column': 'colA',
            'operator': 'eq',
            'value': 'tutu',
        },
    ).execute(sample_df, domain_retriever=None)

    assert_dataframes_equals(df_result, DataFrame({'colA': ['tutu'], 'colB': [2], 'colC': [50]}))


def test_simple_ne_filter(sample_df):
    df_result = FilterStep(
        name='filter',
        condition={
            'column': 'colA',
            'operator': 'ne',
            'value': 'tutu',
        },
    ).execute(sample_df, domain_retriever=None)

    assert_dataframes_equals(
        df_result, DataFrame({'colA': ['toto', 'tata'], 'colB': [1, 3], 'colC': [100, 25]})
    )


def test_simple_gt_filter(sample_df):
    df_result = FilterStep(
        name='filter',
        condition={
            'column': 'colB',
            'operator': 'gt',
            'value': 2,
        },
    ).execute(sample_df, domain_retriever=None)

    assert_dataframes_equals(df_result, DataFrame({'colA': ['tata'], 'colB': [3], 'colC': [25]}))


def test_simple_ge_filter(sample_df):
    df_result = FilterStep(
        name='filter',
        condition={
            'column': 'colB',
            'operator': 'ge',
            'value': 2,
        },
    ).execute(sample_df, domain_retriever=None)

    assert_dataframes_equals(
        df_result, DataFrame({'colA': ['tutu', 'tata'], 'colB': [2, 3], 'colC': [50, 25]})
    )


def test_simple_lt_filter(sample_df):
    df_result = FilterStep(
        name='filter',
        condition={
            'column': 'colB',
            'operator': 'lt',
            'value': 2,
        },
    ).execute(sample_df, domain_retriever=None)

    assert_dataframes_equals(df_result, DataFrame({'colA': ['toto'], 'colB': [1], 'colC': [100]}))


def test_simple_le_filter(sample_df):
    df_result = FilterStep(
        name='filter',
        condition={
            'column': 'colB',
            'operator': 'le',
            'value': 2,
        },
    ).execute(sample_df, domain_retriever=None)

    assert_dataframes_equals(
        df_result, DataFrame({'colA': ['toto', 'tutu'], 'colB': [1, 2], 'colC': [100, 50]})
    )
