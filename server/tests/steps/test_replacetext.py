import random

import numpy as np
import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.replacetext import execute_replacetext
from weaverbird.pipeline.steps import ReplaceTextStep


@pytest.fixture()
def sample_df() -> pd.DataFrame:
    return pd.DataFrame({"values": ["FR", "a string with FR in it", "UK"]})


def test_simple_replace(sample_df):
    step = ReplaceTextStep(name="replacetext", search_column="values", old_str="FR", new_str="France")
    result = execute_replacetext(step, sample_df)
    expected_df = pd.DataFrame({"values": ["France", "a string with France in it", "UK"]})

    assert_dataframes_equals(result, expected_df)


def test_benchmark_replace(benchmark):
    groups = ["group_1", "group_2"]
    df = pd.DataFrame(
        {
            "value": np.random.random(1000),
            "id": list(range(1000)),
            "group": [random.choice(groups) for _ in range(1000)],
        }
    )

    step = ReplaceTextStep(
        name="replacetext",
        search_column="group",
        old_str="group_1",
        new_str="Le groupe NUMER ONE",
    )
    benchmark(execute_replacetext, step, df)
