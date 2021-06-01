import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps.ifthenelse import IfthenelseStep


@pytest.fixture
def sample_df() -> DataFrame:
    return DataFrame({'a_bool': [True, True, False]})


def test_simple_condition(sample_df):
    result_df = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'newColumn': 'result',
            'if': {'column': 'a_bool', 'value': True, 'operator': 'eq'},
            'then': 10,
            'else': 0,
        }
    ).execute(sample_df)

    expected_df = DataFrame({'a_bool': [True, True, False], 'result': [10, 10, 0]})

    assert_dataframes_equals(result_df, expected_df)


def test_simple_condition_strings():
    sample_df = DataFrame({'a_str': ["test", "test", "autre chose"]})
    result_df = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'newColumn': 'test',
            'if': {'column': 'a_str', 'value': "test", 'operator': 'eq'},
            'then': "\"foo\"",
            'else': "\"bar\"",
        }
    ).execute(sample_df)

    expected_df = DataFrame(
        {'a_str': ["test", "test", "autre chose"], 'test': ["foo", "foo", "bar"]}
    )

    assert_dataframes_equals(result_df, expected_df)


def test_then_should_support_formulas():
    base_df = DataFrame({'a_bool': [True, False, True], 'a_number': [1, 2, 3]})
    result_df = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'newColumn': 'result',
            'if': {'column': 'a_bool', 'value': True, 'operator': 'eq'},
            'then': 'a_number',
            'else': 'a_number * -1',
        }
    ).execute(base_df)

    expected_df = DataFrame(
        {'a_bool': [True, False, True], 'a_number': [1, 2, 3], 'result': [1, -2, 3]}
    )

    assert_dataframes_equals(result_df, expected_df)


def test_then_should_support_nested_else():
    base_df = DataFrame({'a_bool': [True, False, False], 'a_number': [1, 2, 3]})
    result_df = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'newColumn': 'result',
            'if': {'column': 'a_bool', 'value': True, 'operator': 'eq'},
            'then': 3,
            'else': {
                'if': {'column': 'a_number', 'value': 3, 'operator': 'eq'},
                'then': 1,
                'else': {
                    'if': {'column': 'a_number', 'value': 2, 'operator': 'eq'},
                    'then': 2,
                    'else': 0,
                },
            },
        }
    ).execute(base_df)

    expected_df = DataFrame(
        {'a_bool': [True, False, False], 'a_number': [1, 2, 3], 'result': [3, 2, 1]}
    )

    assert_dataframes_equals(result_df, expected_df)


def test_isnull():
    df = DataFrame({'a_bool': [True, False, None]})
    step = IfthenelseStep(
        **{
            "name": "ifthenelse",
            "if": {"column": "a_bool", "operator": "isnull", "value": None},
            "newColumn": "test",
            "then": "1",
            "else": "0",
        }
    )

    result = step.execute(df)
    assert_dataframes_equals(result, DataFrame({'a_bool': [True, False, None], 'test': [0, 0, 1]}))


def test_benchmark_ifthenelse(benchmark):
    big_df = DataFrame({'value': list(range(1000))})
    step = IfthenelseStep(
        **{
            "name": "ifthenelse",
            "if": {"column": "value", "operator": "eq", "value": 42},
            "newColumn": "test",
            "then": "1",
            "else": "0",
        }
    )
    benchmark(step.execute, big_df)
