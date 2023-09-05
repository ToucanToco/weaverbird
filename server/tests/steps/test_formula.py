import numpy as np
import pytest
from pandas import DataFrame
from weaverbird.backends.pandas_executor.steps.formula import execute_formula
from weaverbird.pipeline.steps import FormulaStep

from tests.utils import assert_dataframes_equals


@pytest.fixture
def sample_df() -> DataFrame:
    return DataFrame(
        {
            "NAME": ["foo", "bar"],
            "colA": [1, 10],
            "col B": [2, 20],
            "col C": [3, 30],
            "col D": [4, 40],
            "colE": [0, np.nan],
        }
    )


def test_formula(sample_df: DataFrame):
    step = FormulaStep(
        name="formula", new_column="z", formula="(colA + [col B]) * ([col C] + [col D]) / 10"
    )
    df_result = execute_formula(step, sample_df)

    expected_result = sample_df.assign(z=[2.1, 210.0])
    assert_dataframes_equals(df_result, expected_result)


@pytest.mark.parametrize("bad_expression", ["", 'print("hello")', "import re", "x = colA * 2"])
def test_bad_formula(sample_df: DataFrame, bad_expression):
    bad_step = FormulaStep(name="formula", new_column="z", formula=bad_expression)
    with pytest.raises(Exception):  # noqa: B017
        execute_formula(bad_step, sample_df)


def test_formula_division_by_zero_o_null(sample_df: DataFrame):
    step = FormulaStep(name="formula", new_column="z", formula="colA / colE")
    df_result = execute_formula(step, sample_df)

    expected_result = sample_df.assign(z=[np.nan, np.nan])
    assert_dataframes_equals(df_result, expected_result)
