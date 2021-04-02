from typing import Any, List

from pandas import DataFrame, Series
from pandas.testing import assert_frame_equal, assert_series_equal


def assert_dataframes_equals(left: DataFrame, right: DataFrame):
    """
    Compare two dataframes columns and values, not their index.
    """
    assert_frame_equal(
        left.reset_index(drop=True),
        right.reset_index(drop=True),
        check_like=True,
        check_dtype=False,
    )


def assert_column_equals(serie: Series, values: List[Any]):
    """
    Compare vales of a dataframe's column (series)
    """
    assert_series_equal(
        serie.reset_index(drop=True),
        Series(values),
        check_names=False,
        check_dtype=False,
    )
