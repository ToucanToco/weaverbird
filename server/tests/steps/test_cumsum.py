from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.cumsum import execute_cumsum
from weaverbird.pipeline.steps import CumSumStep


def test_cumsum_legacy_syntax():
    df = DataFrame({"x": [1, 2, 3], "date": ["2020", "2021", "2022"]})
    step = CumSumStep(name="cumsum", referenceColumn="date", valueColumn="x", newColumn="y")  # type: ignore
    df_result = execute_cumsum(step, df)

    expected_result = DataFrame({"x": [1, 2, 3], "y": [1, 3, 6], "date": ["2020", "2021", "2022"]})
    assert_dataframes_equals(df_result, expected_result)


def test_benchmark_cumsum_legacy_syntax(benchmark):
    big_df = DataFrame({"value": list(range(1000))})
    step = CumSumStep(
        name="cumsum", referenceColumn="value", value_column="value", new_column="my_cumsum"
    )
    benchmark(execute_cumsum, step, big_df)


def test_benchmark_cumsum(benchmark):
    big_df = DataFrame({"value": list(range(1000))})
    step = CumSumStep(
        name="cumsum",
        referenceColumn="value",
        to_cumsum=[["value", "my_cumsum"]],
    )
    benchmark(execute_cumsum, step, big_df)
