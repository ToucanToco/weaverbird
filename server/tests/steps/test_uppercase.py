import random

import numpy as np
import pandas as pd

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.uppercase import execute_uppercase
from weaverbird.pipeline.steps import UppercaseStep


def test_simple_uppercase():
    sample_df = pd.DataFrame({'values': ['foobar', 'flixbuz']})
    step = UppercaseStep(name='uppercase', column='values')
    result_df = execute_uppercase(step, sample_df)
    expected_df = pd.DataFrame({'values': ['FOOBAR', 'FLIXBUZ']})

    assert_dataframes_equals(result_df, expected_df)


def test_utf8_uppercase():
    sample_df = pd.DataFrame({'values': ['foobar', 'óó']})
    step = UppercaseStep(name='uppercase', column='values')
    result_df = execute_uppercase(step, sample_df)
    expected_df = pd.DataFrame({'values': ['FOOBAR', 'ÓÓ']})

    assert_dataframes_equals(result_df, expected_df)


def test_benchmark_uppercase(benchmark):
    groups = ['group_1', 'group_2']
    df = pd.DataFrame(
        {
            'value': np.random.random(1000),
            'id': list(range(1000)),
            'group': [random.choice(groups) for _ in range(1000)],
        }
    )

    step = UppercaseStep(name='uppercase', column='group')
    benchmark(execute_uppercase, step, df)
