import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps.filter import ComparisonCondition
from weaverbird.steps.ifthenelse import IfthenelseStep


@pytest.fixture
def sample_df() -> DataFrame:
    return DataFrame({'a_bool': [True, True, False]})


def test_simple_condition(sample_df):
    result_df = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'newColumn': 'result',
            'if': ComparisonCondition(column='a_bool', value=True, operator='eq'),
            'then': 10,
            'else': 0,
        }
    ).execute(sample_df)

    expected_df = DataFrame({'a_bool': [True, True, False], 'result': [10, 10, 0]})

    assert_dataframes_equals(result_df, expected_df)
