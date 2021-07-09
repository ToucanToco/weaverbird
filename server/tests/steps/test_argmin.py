import numpy as np
import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.argmin import execute_argmin
from weaverbird.pipeline.steps.argmin import ArgminStep


@pytest.fixture
def sample_df():
    return DataFrame(
        {
            'label': ['label1', 'label2', 'label3', 'label4', 'label5', 'label6'],
            'group': ['group 1', 'group 1', 'group 1', 'group 2', 'group 2', 'group 2'],
            'value': [13, 7, 20, 1, 10, 5],
        }
    )


def test_simple_argmin(sample_df):
    step = ArgminStep(name='argmin', column='value')
    result = execute_argmin(step, sample_df, domain_retriever=None)
    assert_dataframes_equals(
        result,
        DataFrame(
            {
                'label': ['label4'],
                'group': ['group 2'],
                'value': [1],
            }
        ),
    )


def test_argmin_with_group(sample_df):
    step = ArgminStep(name='argmin', column='value', groups=['group'])
    result = execute_argmin(step, sample_df, domain_retriever=None)
    assert_dataframes_equals(
        result,
        DataFrame(
            {
                'label': ['label2', 'label4'],
                'group': ['group 1', 'group 2'],
                'value': [7, 1],
            }
        ),
    )


def test_benchmark_argmin(benchmark):
    sample_df = DataFrame(
        {
            'Group': ['Group 1'] * 500 + ['Group 2'] * 500,
            'Value1': np.random.random(1000),
            'Value2': np.random.random(1000),
        }
    )
    step = ArgminStep(name='argmin', column='Value1', groups=['Group'])

    benchmark(execute_argmin, step, sample_df)
