import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals
from weaverbird.steps.sort import ColumnSort, SortStep


@pytest.fixture
def sample_df():
    return pd.DataFrame(
        {
            'Company': ['Label 1', 'Label 2', 'Label 3', 'Label 4', 'Label 5', 'Label 6'],
            'Group': ['Group 1'] * 3 + ['Group 2'] * 3,
            'Value': [13, 7, 20, 1, 10, 5],
        }
    )


def test_simple_sort(sample_df):
    step = SortStep(
        name='sort',
        columns=[
            ColumnSort(column='Group', order='asc'),
            ColumnSort(column='Value', order='desc'),
        ],
    )
    result_df = step.execute(sample_df)
    expected_df = pd.DataFrame(
        {
            'Company': ['Label 3', 'Label 1', 'Label 2', 'Label 5', 'Label 6', 'Label 4'],
            'Group': ['Group 1'] * 3 + ['Group 2'] * 3,
            'Value': [20, 13, 7, 10, 5, 1],
        }
    )
    assert_dataframes_equals(result_df, expected_df)
