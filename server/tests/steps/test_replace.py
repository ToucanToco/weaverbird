import random

import numpy as np
import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals
from weaverbird.steps.replace import ReplaceStep


@pytest.fixture()
def sample_df() -> pd.DataFrame:
    return pd.DataFrame({'values': ['FR', 'US', 'UK']})


def test_simple_replace(sample_df):
    step = ReplaceStep(
        name='replace',
        search_column='values',
        to_replace=[['FR', 'France'], ['US', 'UNITED STATES']],
    )
    result = step.execute(sample_df)
    expected_df = pd.DataFrame({'values': ['France', 'UNITED STATES', 'UK']})

    assert_dataframes_equals(result, expected_df)


def test_benchmark_replace(benchmark):
    groups = ['group_1', 'group_2']
    df = pd.DataFrame(
        {
            'value': np.random.random(1000),
            'id': list(range(1000)),
            'group': [random.choice(groups) for _ in range(1000)],
        }
    )

    step = ReplaceStep(
        name='replace',
        search_column='group',
        to_replace=[['group_1', 'Le groupe NUMER ONE'], ['group_2', 'Le deuxieme groupe !']],
    )
    benchmark(step.execute, df)
