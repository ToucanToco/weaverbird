import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.conditions import ComparisonCondition
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


def test_then_should_support_formulas():
    base_df = DataFrame({'a_bool': [True, False, True], 'a_number': [1, 2, 3]})
    result_df = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'newColumn': 'result',
            'if': ComparisonCondition(column='a_bool', value=True, operator='eq'),
            'then': 'a_number',
            'else': 'a_number * -1',
        }
    ).execute(base_df)

    expected_df = DataFrame(
        {'a_bool': [True, False, True], 'a_number': [1, 2, 3], 'result': [1, -2, 3]}
    )

    assert_dataframes_equals(result_df, expected_df)
