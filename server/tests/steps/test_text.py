import random
from datetime import datetime
from zoneinfo import ZoneInfo

import numpy as np
import pytest
from pandas import DataFrame
from weaverbird.backends.pandas_executor.steps.text import execute_text
from weaverbird.pipeline.steps import TextStep

from tests.utils import assert_dataframes_equals


@pytest.fixture
def sample_df():
    return DataFrame({"NAME": ["foo", "bar"], "AGE": [42, 43], "SCORE": [100, 200]})


def test_text(sample_df: DataFrame):
    step = TextStep(name="text", new_column="BEST SINGER EVER", text="jean-jacques-goldman")
    df_result = execute_text(step, sample_df)

    expected_result = DataFrame(
        {
            "NAME": ["foo", "bar"],
            "AGE": [42, 43],
            "SCORE": [100, 200],
            "BEST SINGER EVER": ["jean-jacques-goldman", "jean-jacques-goldman"],
        }
    )
    assert_dataframes_equals(df_result, expected_result)


def test_text_datetime_with_tz():
    now = datetime(2022, 10, 20, 14, 18, 22).replace(tzinfo=ZoneInfo("Europe/Paris"))
    step = TextStep(name="text", new_column="foo", text=now)
    assert step.text.tzinfo is None  # it is now tz naive
    assert step.text.isoformat() == "2022-10-20T12:18:22"


def test_benchmark_text(benchmark):
    groups = ["group_1", "group_2"]
    df = DataFrame(
        {
            "value": np.random.random(1000),
            "id": list(range(1000)),
            "group": [random.choice(groups) for _ in range(1000)],
        }
    )

    step = TextStep(name="text", new_column="BEST SINGER EVER", text="jean-jacques-goldman")
    benchmark(execute_text, step, df)
