import random

import numpy as np
import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.split import execute_split
from weaverbird.pipeline.steps import SplitStep


@pytest.fixture()
def sample_df():
    return pd.DataFrame(
        {
            'Label': [
                'Label 1 - Groupe 1 - France',
                'Label 2 - Groupe 1 - Spain',
                'Label 3 - Groupe 1 - USA',
                'Label 4 - Groupe 2 - France',
                'Label 5 - Groupe 2 - Spain',
                'Label 6 - Groupe 2 - USA',
            ],
            'Values': [13, 7, 20, 1, 10, 5],
        }
    )


def test_keep_all_col(sample_df):
    step = SplitStep(name='split', column='Label', delimiter='-', number_cols_to_keep=3)
    result_df = execute_split(step, sample_df)
    expected_df = pd.DataFrame(
        {
            'Label': [
                'Label 1 - Groupe 1 - France',
                'Label 2 - Groupe 1 - Spain',
                'Label 3 - Groupe 1 - USA',
                'Label 4 - Groupe 2 - France',
                'Label 5 - Groupe 2 - Spain',
                'Label 6 - Groupe 2 - USA',
            ],
            'Label_1': ['Label 1 ', 'Label 2 ', 'Label 3 ', 'Label 4 ', 'Label 5 ', 'Label 6 '],
            'Label_2': [' Groupe 1 '] * 3 + [' Groupe 2 '] * 3,
            'Label_3': [' France', ' Spain', ' USA'] * 2,
            'Values': [13, 7, 20, 1, 10, 5],
        }
    )
    assert_dataframes_equals(result_df, expected_df)


def test_keep_less_columns(sample_df):
    step = SplitStep(name='split', column='Label', delimiter='-', number_cols_to_keep=2)
    result_df = execute_split(step, sample_df)
    expected_df = pd.DataFrame(
        {
            'Label': [
                'Label 1 - Groupe 1 - France',
                'Label 2 - Groupe 1 - Spain',
                'Label 3 - Groupe 1 - USA',
                'Label 4 - Groupe 2 - France',
                'Label 5 - Groupe 2 - Spain',
                'Label 6 - Groupe 2 - USA',
            ],
            'Label_1': ['Label 1 ', 'Label 2 ', 'Label 3 ', 'Label 4 ', 'Label 5 ', 'Label 6 '],
            'Label_2': [' Groupe 1 '] * 3 + [' Groupe 2 '] * 3,
            'Values': [13, 7, 20, 1, 10, 5],
        }
    )
    assert_dataframes_equals(result_df, expected_df)


def test_benchmark_split(benchmark):
    groups = ['group_1', 'group_2']
    df = pd.DataFrame(
        {
            'value': np.random.random(1000),
            'id': list(range(1000)),
            'group': [random.choice(groups) for _ in range(1000)],
        }
    )

    step = SplitStep(name='split', column='group', delimiter='_', number_cols_to_keep=2)
    benchmark(execute_split, step, df)
