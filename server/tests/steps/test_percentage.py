import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals
from weaverbird.steps.percentage import PercentageStep


@pytest.fixture()
def sample_df():
    return pd.DataFrame({'values': [10, 50, 25, 15]})


def test_simple_percentage(sample_df):
    step = PercentageStep(name='percentage', column='values', newColumnName='result')
    result = step.execute(sample_df)
    expected_df = pd.DataFrame({'values': [10, 50, 25, 15], 'result': [10.0, 50.0, 25.0, 15.0]})

    assert_dataframes_equals(result, expected_df)


def test_percentage_with_groups():
    sample_df = pd.DataFrame({'a_bool': [True, False, True, False], 'values': [50, 25, 50, 75]})

    step = PercentageStep(
        name='percentage', column='values', group=['a_bool'], newColumnName='result'
    )
    result = step.execute(sample_df)
    expected_df = pd.DataFrame(
        {
            'a_bool': [True, False, True, False],
            'values': [50, 25, 50, 75],
            'result': [50.0, 25.0, 50.0, 75.0],
        }
    )

    assert_dataframes_equals(result, expected_df)


def test_default_column_name():
    sample_df = pd.DataFrame({'values': [50, 25, 50, 75]})

    step = PercentageStep(name='percentage', column='values')
    result = step.execute(sample_df)
    assert 'values_PCT' in result
