import numpy as np
import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.fillna import execute_fillna
from weaverbird.pipeline.steps import FillnaStep


@pytest.fixture
def sample_df():
    return DataFrame(
        {'colA': ['toto', 'tutu', None], 'colB': [1, 2, None], 'colC': [100, 50, None]}
    )


def test_simple_fillna(sample_df):
    step = FillnaStep(name='fillna', columns=['colB'], value=-1)
    result = execute_fillna(step, sample_df, None, None)
    assert_dataframes_equals(
        result,
        DataFrame({'colA': ['toto', 'tutu', None], 'colB': [1, 2, -1], 'colC': [100, 50, None]}),
    )


def test_simple_fillna_legacy_syntax(sample_df):
    step = FillnaStep(name='fillna', column='colB', value=-1)  # type: ignore
    result = execute_fillna(step, sample_df, None, None)
    assert_dataframes_equals(
        result,
        DataFrame({'colA': ['toto', 'tutu', None], 'colB': [1, 2, -1], 'colC': [100, 50, None]}),
    )


def test_fillna_multi_columns(sample_df):
    step = FillnaStep(name='fillna', columns=['colB', 'colC'], value=-1)
    result = execute_fillna(step, sample_df, None, None)
    assert_dataframes_equals(
        result,
        DataFrame({'colA': ['toto', 'tutu', None], 'colB': [1, 2, -1], 'colC': [100, 50, -1]}),
    )


def test_fillna_multi_columns_incompatible_types(sample_df):
    step = FillnaStep(name='fillna', columns=['colA', 'colB', 'colC'], value=-1)
    result = execute_fillna(step, sample_df, None, None)
    assert_dataframes_equals(
        result, DataFrame({'colA': ['toto', 'tutu', -1], 'colB': [1, 2, -1], 'colC': [100, 50, -1]})
    )


def test_benchmark_evolution(benchmark):

    df = DataFrame({'value': np.append(np.random.random(500), [None] * 500)})
    step = FillnaStep(name='fillna', columns=['value'], value=-1)
    benchmark(execute_fillna, step, df)
