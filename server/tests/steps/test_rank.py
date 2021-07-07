import random

import numpy as np
import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.rank import execute_rank
from weaverbird.pipeline.steps import RankStep


@pytest.fixture
def sample_df():
    return DataFrame(
        {'COUNTRY': ['France'] * 3 + ['USA'] * 4, 'VALUE': [10, 20, 30, 10, 40, 30, 50]}
    )


def test_rank(sample_df: DataFrame):
    step = RankStep(
        name='rank',
        valueCol='VALUE',
        order='asc',
        method='standard',
    )
    df_result = execute_rank(step, sample_df)

    expected_result = DataFrame(
        {
            'COUNTRY': ['France', 'USA', 'France', 'France', 'USA', 'USA', 'USA'],
            'VALUE': [10, 10, 20, 30, 30, 40, 50],
            'VALUE_RANK': [1, 1, 3, 4, 4, 6, 7],
        }
    )
    assert_dataframes_equals(df_result, expected_result)


def test_rank_with_groups(sample_df: DataFrame):
    step = RankStep(
        name='rank',
        valueCol='VALUE',
        groupby=['COUNTRY'],
        order='desc',
        method='dense',
        newColumnName='rank',
    )
    df_result = execute_rank(step, sample_df)

    expected_result = DataFrame(
        {
            'COUNTRY': ['France', 'USA', 'France', 'USA', 'France', 'USA', 'USA'],
            'VALUE': [30, 50, 20, 40, 10, 30, 10],
            'rank': [1, 1, 2, 2, 3, 3, 4],
        }
    )
    assert_dataframes_equals(df_result, expected_result)


def test_benchmark_rank(benchmark):
    groups = ['group_1', 'group_2']
    df = DataFrame(
        {
            'value': np.random.random(1000),
            'id': list(range(1000)),
            'group': [random.choice(groups) for _ in range(1000)],
        }
    )

    step = RankStep(
        name='rank',
        valueCol='value',
        groupby=['group'],
        order='desc',
        method='dense',
        newColumnName='rank',
    )
    benchmark(execute_rank, step, df)
