import random

import numpy as np
import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import TopStep


@pytest.fixture
def sample_df():
    return DataFrame(
        {
            'Label': [f'Label {i+1}' for i in range(6)],
            'Group': ['Group 1'] * 3 + ['Group 2'] * 3,
            'Value': [13, 7, 20, 1, 10, 5],
        }
    )


def test_top_asc(sample_df):
    step = TopStep(name='top', rank_on='Value', sort='asc', limit=3)
    result = step.execute(sample_df)
    assert_dataframes_equals(
        result,
        DataFrame(
            {
                'Label': ['Label 4', 'Label 6', 'Label 2'],
                'Group': ['Group 2', 'Group 2', 'Group 1'],
                'Value': [1, 5, 7],
            }
        ),
    )


def test_top_desc_with_groups(sample_df):
    step = TopStep(name='top', rank_on='Value', groups=['Group'], sort='desc', limit=1)
    result = step.execute(sample_df)
    assert_dataframes_equals(
        result,
        DataFrame(
            {
                'Label': ['Label 3', 'Label 5'],
                'Group': ['Group 1', 'Group 2'],
                'Value': [20, 10],
            }
        ),
    )


def test_benchmark_top(benchmark):
    groups = ['group_1', 'group_2']
    df = DataFrame(
        {
            'value': np.random.random(1000),
            'id': list(range(1000)),
            'group': [random.choice(groups) for _ in range(1000)],
        }
    )

    step = TopStep(name='top', rank_on='value', groups=['group'], sort='desc', limit=1)
    benchmark(step.execute, df)
