from typing import Any

import pytest
from pandas import NA, DataFrame
from toucan_connectors.common import nosql_apply_parameters_to_query

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.ifthenelse import execute_ifthenelse
from weaverbird.pipeline.steps.ifthenelse import IfthenelseStep, IfThenElseStepWithVariables


@pytest.fixture
def sample_df() -> DataFrame:
    return DataFrame({"a_bool": [True, True, False]})


def test_simple_condition(sample_df):
    step = IfthenelseStep(
        **{
            "name": "ifthenelse",
            "newColumn": "result",
            "if": {"column": "a_bool", "value": True, "operator": "eq"},
            "then": 10,
            "else": 0,
        }
    )
    result_df = execute_ifthenelse(step, sample_df)

    expected_df = DataFrame({"a_bool": [True, True, False], "result": [10, 10, 0]})

    assert_dataframes_equals(result_df, expected_df)


def test_simple_condition_strings():
    sample_df = DataFrame({"a_str": ["test", "test", "autre chose"]})
    step = IfthenelseStep(
        **{
            "name": "ifthenelse",
            "newColumn": "test",
            "if": {"column": "a_str", "value": "test", "operator": "eq"},
            "then": '"foo"',
            "else": '"bar"',
        }
    )
    result_df = execute_ifthenelse(step, sample_df)

    expected_df = DataFrame({"a_str": ["test", "test", "autre chose"], "test": ["foo", "foo", "bar"]})

    assert_dataframes_equals(result_df, expected_df)


def test_then_should_support_formulas():
    base_df = DataFrame({"a_bool": [True, False, True], "a_number": [1, 2, 3]})
    step = IfthenelseStep(
        **{
            "name": "ifthenelse",
            "newColumn": "result",
            "if": {"column": "a_bool", "value": True, "operator": "eq"},
            "then": "a_number",
            "else": "a_number * -1",
        }
    )
    result_df = execute_ifthenelse(step, base_df)

    expected_df = DataFrame({"a_bool": [True, False, True], "a_number": [1, 2, 3], "result": [1, -2, 3]})

    assert_dataframes_equals(result_df, expected_df)


def test_then_should_support_nested_else():
    base_df = DataFrame({"a_bool": [True, False, False], "a_number": [1, 2, 3]})
    step = IfthenelseStep(
        **{
            "name": "ifthenelse",
            "newColumn": "result",
            "if": {"column": "a_bool", "value": True, "operator": "eq"},
            "then": 3,
            "else": {
                "if": {"column": "a_number", "value": 3, "operator": "eq"},
                "then": 1,
                "else": {
                    "if": {"column": "a_number", "value": 2, "operator": "eq"},
                    "then": 2,
                    "else": 0,
                },
            },
        }
    )
    result_df = execute_ifthenelse(step, base_df)

    expected_df = DataFrame({"a_bool": [True, False, False], "a_number": [1, 2, 3], "result": [3, 2, 1]})

    assert_dataframes_equals(result_df, expected_df)


def test_isnull():
    df = DataFrame({"a_bool": [True, False, None]})
    step = IfthenelseStep(
        **{
            "name": "ifthenelse",
            "if": {"column": "a_bool", "operator": "isnull", "value": None},
            "newColumn": "test",
            "then": "1",
            "else": "0",
        }
    )

    result = execute_ifthenelse(step, df)
    assert_dataframes_equals(result, DataFrame({"a_bool": [True, False, None], "test": [0, 0, 1]}))


def test_benchmark_ifthenelse(benchmark):
    big_df = DataFrame({"value": list(range(1000))})
    step = IfthenelseStep(
        **{
            "name": "ifthenelse",
            "if": {"column": "value", "operator": "eq", "value": 42},
            "newColumn": "test",
            "then": "1",
            "else": "0",
        }
    )
    benchmark(execute_ifthenelse, step, big_df)


def test_ifthenelse_match_with_na():
    df = DataFrame({"a": ["hello", NA, "world"], "b": ["b_hello", "b_null", "b_world"]})
    step = IfthenelseStep(
        **{
            "name": "ifthenelse",
            "if": {"column": "a", "operator": "matches", "value": "hello"},
            "then": '"hello"',
            "else": {
                "name": "ifthenelse",
                "if": {"column": "a", "operator": "matches", "value": "world"},
                "then": '"world"',
                "else": "b",
            },
            "newColumn": "test",
        }
    )
    result = execute_ifthenelse(step, df)
    # Cannot use assert_dataframes_equals here, because "boolean value of NA" is ambiguous
    assert result["test"].to_list() == ["hello", "b_null", "world"]


@pytest.fixture
def raw_ifthenelse_with_variables() -> dict[str, Any]:
    return {
        "if": {
            "and": [
                {
                    "value": {
                        "date": "<%=appRequesters.date.start%>",
                        "duration": "year",
                        "operator": "until",
                        "quantity": 1,
                    },
                    "column": "Date_firstDayOfMonth",
                    "operator": "from",
                },
                {
                    "value": {
                        "date": "<%=appRequesters.date.end%>",
                        "duration": "year",
                        "operator": "until",
                        "quantity": 1,
                    },
                    "column": "Date_firstDayOfMonth",
                    "operator": "until",
                },
            ]
        },
        "else": "0",
        "name": "ifthenelse",
        "then": "1",
        "newColumn": "is_previous_year",
    }


def test_ifthenelsestep_with_variables_in_relative_date(raw_ifthenelse_with_variables: dict[str, Any]) -> None:
    step = IfThenElseStepWithVariables(**raw_ifthenelse_with_variables)
    assert step.condition.and_[0].value.date == "<%=appRequesters.date.start%>"
    assert step.condition.and_[1].value.date == "<%=appRequesters.date.end%>"


def test_render_ifthenelsestep_step_with_variables(available_variables: dict[str, Any]) -> None:
    step = IfThenElseStepWithVariables(
        **{
            "condition": {
                "column": "foo",
                "value": "{{ TODAY }}",
                "operator": "from",
            },
            "then": 1,
            "else": 2,
            "new_column": "coucou",
        }
    )
    rendered = step.render(available_variables, nosql_apply_parameters_to_query)
    assert rendered.condition.value == available_variables["TODAY"]

    step = IfThenElseStepWithVariables(
        **{
            "condition": {
                "value": {
                    "date": "{{ TODAY }}",
                    "quantity": 1,
                    "duration": "year",
                    "operator": "until",
                },
                "operator": "from",
                "column": "Date_firstDayOfMonth",
            },
            "then": 1,
            "else": 2,
            "new_column": "coucou",
        }
    )

    rendered = step.render(available_variables, nosql_apply_parameters_to_query)
    assert rendered.condition.value.date == available_variables["TODAY"]
