import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import FilterStep
from weaverbird.steps.filter import SimpleCondition


def test_simple_eq_filter():
    df = DataFrame({'colA': ['toto', 'tutu', 'tata'], 'colB': [1, 2, 3], 'colC': [100, 50, 25]})

    df_result = FilterStep(
        name='filter',
        condition={
            'column': 'colA',
            'operator': 'eq',
            'value': 'tutu',
        },
    ).execute(df, domain_retriever=None)

    assert_dataframes_equals(df_result, DataFrame({'colA': ['tutu'], 'colB': [2], 'colC': [50]}))


@pytest.mark.parametrize('value', [0, False, True, 0.0, 1, 1.5, '', '0', None, [], [0], '0.0'])
def test_simple_condition_valid_values(value) -> None:
    # Ensure pydantic cast does not change types for `value` field:
    sc = SimpleCondition(column='x', operator='eq', value=value)
    result_value = sc.value
    assert value == result_value
    assert type(value) == type(result_value)
