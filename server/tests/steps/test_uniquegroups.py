import random

import numpy as np
import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import UniqueGroupsStep


@pytest.fixture
def sample_df():
    return DataFrame(
        {
            'NAME': ['foo', 'bar', 'foo', 'foo', 'bar', 'foo'],
            'AGE': [42, 43, 42, 42, 43, 44],
            'SCORE': [100, 200, 800, 100, 200, 900],
        }
    )


def test_uniquegroups(sample_df: DataFrame):
    df_result = UniqueGroupsStep(
        name='uniquegroups',
        on=['NAME', 'AGE'],
    ).execute(sample_df)

    expected_result = DataFrame({'NAME': ['foo', 'bar', 'foo'], 'AGE': [42, 43, 44]})
    assert_dataframes_equals(df_result, expected_result)


def test_benchmark_uniquegroups(benchmark):
    groups = ['group_1', 'group_2']
    df = DataFrame(
        {
            'value': np.random.random(1000),
            'id': list(range(1000)),
            'group': [random.choice(groups) for _ in range(1000)],
        }
    )

    step = UniqueGroupsStep(
        name='uniquegroups',
        on=['group', 'value'],
    )
    benchmark(step.execute, df)
