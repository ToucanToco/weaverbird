from pandas import DataFrame
from pandas.testing import assert_frame_equal


def assert_dataframes_equals(left: DataFrame, right: DataFrame):
    """
    Compare two dataframes columns and values, not their index.
    """
    assert_frame_equal(left.reset_index(drop=True), right.reset_index(drop=True))
