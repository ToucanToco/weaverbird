import random

import numpy as np
import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.rename import execute_rename
from weaverbird.pipeline.steps import RenameStep


@pytest.fixture
def sample_df():
    return DataFrame({'NAME': ['foo', 'bar'], 'AGE': [42, 43], 'SCORE': [100, 200]})


def test_rename(sample_df: DataFrame):
    step = RenameStep(
        name='rename',
        toRename=[
            ['NAME', 'name'],
            ['AGE', 'age'],
        ],
    )
    df_result = execute_rename(step, sample_df)

    expected_result = DataFrame({'name': ['foo', 'bar'], 'age': [42, 43], 'SCORE': [100, 200]})
    assert_dataframes_equals(df_result, expected_result)


def test_rename_legacy_syntax(sample_df: DataFrame):
    step = RenameStep(name='rename', oldname='NAME', newname='name')  # type: ignore
    df_result = execute_rename(step, sample_df)

    expected_result = DataFrame({'name': ['foo', 'bar'], 'AGE': [42, 43], 'SCORE': [100, 200]})
    assert_dataframes_equals(df_result, expected_result)


def test_benchmark_rename(benchmark):
    groups = ['group_1', 'group_2']
    df = DataFrame(
        {
            'value': np.random.random(1000),
            'id': list(range(1000)),
            'group': [random.choice(groups) for _ in range(1000)],
        }
    )

    step = RenameStep(
        name='rename',
        toRename=[
            ['group', 'GROUP'],
        ],
    )
    benchmark(execute_rename, step, df)
