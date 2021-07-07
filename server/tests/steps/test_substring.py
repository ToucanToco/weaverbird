import random

import numpy as np
import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.substring import execute_substring
from weaverbird.pipeline.steps import SubstringStep


@pytest.fixture()
def sample_df():
    return pd.DataFrame(
        {
            'Label': ['foo', 'overflow', 'some_text', 'a_word', 'toucan', 'toco'],
            'Value:': [13, 7, 20, 1, 10, 5],
        }
    )


def test_substring_positive_start_end_idx(sample_df):
    step = SubstringStep(name='substring', column='Label', start_index=1, end_index=4)
    result_df = execute_substring(step, sample_df)

    expected_df = pd.DataFrame(
        {
            'Label': ['foo', 'overflow', 'some_text', 'a_word', 'toucan', 'toco'],
            'Value:': [13, 7, 20, 1, 10, 5],
            'Label_SUBSTR': ['foo', 'over', 'some', 'a_wo', 'touc', 'toco'],
        }
    )
    assert_dataframes_equals(result_df, expected_df)


def test_substring_positive_start_negative_end(sample_df):
    step = SubstringStep(name='substring', column='Label', start_index=2, end_index=-2)
    result_df = execute_substring(step, sample_df)

    expected_df = pd.DataFrame(
        {
            'Label': ['foo', 'overflow', 'some_text', 'a_word', 'toucan', 'toco'],
            'Value:': [13, 7, 20, 1, 10, 5],
            'Label_SUBSTR': ['o', 'verflo', 'ome_tex', '_wor', 'ouca', 'oc'],
        }
    )
    assert_dataframes_equals(result_df, expected_df)


def test_substring_negative_start_negative_end(sample_df):
    step = SubstringStep(name='substring', column='Label', start_index=-3, end_index=-1)
    result_df = execute_substring(step, sample_df)

    expected_df = pd.DataFrame(
        {
            'Label': ['foo', 'overflow', 'some_text', 'a_word', 'toucan', 'toco'],
            'Value:': [13, 7, 20, 1, 10, 5],
            'Label_SUBSTR': ['foo', 'low', 'ext', 'ord', 'can', 'oco'],
        }
    )
    assert_dataframes_equals(result_df, expected_df)


def test_substring_new_column_name(sample_df):
    step = SubstringStep(
        name='substring', column='Label', start_index=-3, end_index=-1, newColumnName='FOO'
    )
    result_df = execute_substring(step, sample_df)

    expected_df = pd.DataFrame(
        {
            'Label': ['foo', 'overflow', 'some_text', 'a_word', 'toucan', 'toco'],
            'Value:': [13, 7, 20, 1, 10, 5],
            'FOO': ['foo', 'low', 'ext', 'ord', 'can', 'oco'],
        }
    )
    assert_dataframes_equals(result_df, expected_df)


def test_benchmark_substring(benchmark):
    groups = ['group_1', 'group_2']
    df = pd.DataFrame(
        {
            'value': np.random.random(1000),
            'id': list(range(1000)),
            'group': [random.choice(groups) for _ in range(1000)],
        }
    )

    step = SubstringStep(
        name='substring', column='group', start_index=0, end_index=3, newColumnName='FOO'
    )
    benchmark(execute_substring, step, df)
