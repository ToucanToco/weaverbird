import json
from datetime import datetime
from os.path import dirname
from os.path import join as path_join
from typing import Any
from zoneinfo import ZoneInfo

import pytest
from pandas import DataFrame, read_json
from pandas.testing import assert_frame_equal
from toucan_connectors.common import nosql_apply_parameters_to_query
from weaverbird.backends.pandas_executor.steps.filter import execute_filter
from weaverbird.pipeline.conditions import (
    ComparisonCondition,
    ConditionComboAnd,
    DateBoundCondition,
)
from weaverbird.pipeline.dates import RelativeDateWithVariables
from weaverbird.pipeline.steps import FilterStep
from weaverbird.pipeline.steps.filter import FilterStepWithVariables

from tests.utils import assert_dataframes_equals


@pytest.fixture
def sample_df():
    return DataFrame({"colA": ["toto", "tutu", "tata"], "colB": [1, 2, 3], "colC": [100, 50, 25]})


@pytest.mark.parametrize("value", [0, False, True, 0.0, 1, 1.5, "", "0", None, [], [0], "0.0"])
def test_simple_condition_valid_values(value) -> None:
    # Ensure pydantic cast does not change types for `value` field:
    sc = ComparisonCondition(column="x", operator="eq", value=value)
    result_value = sc.value
    assert value == result_value
    assert type(value) is type(result_value)


def test_simple_eq_filter(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "column": "colA",
            "operator": "eq",
            "value": "tutu",
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({"colA": ["tutu"], "colB": [2], "colC": [50]}))


def test_simple_ne_filter(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "column": "colA",
            "operator": "ne",
            "value": "tutu",
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({"colA": ["toto", "tata"], "colB": [1, 3], "colC": [100, 25]}))


def test_simple_gt_filter(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "column": "colB",
            "operator": "gt",
            "value": 2,
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({"colA": ["tata"], "colB": [3], "colC": [25]}))


def test_simple_ge_filter(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "column": "colB",
            "operator": "ge",
            "value": 2,
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({"colA": ["tutu", "tata"], "colB": [2, 3], "colC": [50, 25]}))


def test_simple_lt_filter(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "column": "colB",
            "operator": "lt",
            "value": 2,
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({"colA": ["toto"], "colB": [1], "colC": [100]}))


def test_simple_le_filter(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "column": "colB",
            "operator": "le",
            "value": 2,
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({"colA": ["toto", "tutu"], "colB": [1, 2], "colC": [100, 50]}))


def test_simple_in_filter(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "column": "colA",
            "operator": "in",
            "value": ["toto", "tutu"],
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({"colA": ["toto", "tutu"], "colB": [1, 2], "colC": [100, 50]}))


def test_simple_nin_filter(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "column": "colA",
            "operator": "nin",
            "value": ["toto", "tutu"],
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({"colA": ["tata"], "colB": [3], "colC": [25]}))


def test_simple_null_filter(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "column": "colA",
            "operator": "isnull",
        },
    )
    df_result = execute_filter(step, sample_df)

    assert df_result.empty


def test_simple_notnull_filter(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "column": "colA",
            "operator": "notnull",
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, sample_df)


def test_simple_matches_filter(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "column": "colA",
            "operator": "matches",
            "value": "a.a",
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({"colA": ["tata"], "colB": [3], "colC": [25]}))


def test_simple_notmatches_filter(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "column": "colA",
            "operator": "notmatches",
            "value": "a.a",
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({"colA": ["toto", "tutu"], "colB": [1, 2], "colC": [100, 50]}))


def test_and_logical_conditions(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "and": [
                {
                    "column": "colB",
                    "operator": "le",
                    "value": 2,
                },
                {
                    "column": "colC",
                    "operator": "gt",
                    "value": 75,
                },
            ]
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({"colA": ["toto"], "colB": [1], "colC": [100]}))


def test_or_logical_conditions(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "or": [
                {
                    "column": "colA",
                    "operator": "eq",
                    "value": "toto",
                },
                {
                    "column": "colC",
                    "operator": "lt",
                    "value": 33,
                },
            ]
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({"colA": ["toto", "tata"], "colB": [1, 3], "colC": [100, 25]}))


def test_nested_logical_conditions(sample_df):
    step = FilterStep(
        name="filter",
        condition={
            "and": [
                {
                    "or": [
                        {
                            "column": "colA",
                            "operator": "eq",
                            "value": "toto",
                        },
                        {
                            "column": "colC",
                            "operator": "lt",
                            "value": 33,
                        },
                    ]
                },
                {"column": "colB", "operator": "gt", "value": 2},
            ]
        },
    )
    df_result = execute_filter(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({"colA": ["tata"], "colB": [3], "colC": [25]}))


def test_benchmark_filter(benchmark):
    big_df = DataFrame({"value": list(range(1000))})
    step = FilterStep(name="filter", condition={"column": "value", "operator": "lt", "value": 20})
    result = benchmark(execute_filter, step, big_df)
    assert len(result) == 20


@pytest.fixture
def date_df() -> DataFrame:
    with open(path_join(dirname(__file__), "fixtures", "sales_df.json")) as fd:
        return read_json(fd, orient="table")


@pytest.fixture
def expected_date_filter_result() -> DataFrame:
    return read_json(
        json.dumps(
            {
                "schema": {
                    "fields": [
                        {"name": "Transaction_date", "type": "datetime", "tz": "UTC"},
                        {"name": "Product", "type": "string"},
                        {"name": "Price", "type": "integer"},
                    ],
                    "pandas_version": "1.4.0",
                },
                "data": [
                    {
                        "Transaction_date": "2009-01-02T06:17:00.000Z",
                        "Product": "Product1",
                        "Price": 1200,
                    },
                    {
                        "Transaction_date": "2009-01-02T04:53:00.000Z",
                        "Product": "Product1",
                        "Price": 1200,
                    },
                    {
                        "Transaction_date": "2009-01-02T13:08:00.000Z",
                        "Product": "Product1",
                        "Price": 1200,
                    },
                    {
                        "Transaction_date": "2009-01-03T14:44:00.000Z",
                        "Product": "Product1",
                        "Price": 1200,
                    },
                    {
                        "Transaction_date": "2009-01-02T20:09:00.000Z",
                        "Product": "Product1",
                        "Price": 1200,
                    },
                ],
            }
        ),
        orient="table",
    ).reset_index(drop=True)


def test_date_filter(date_df: DataFrame, expected_date_filter_result: DataFrame):
    # Datetimes
    step = FilterStep(
        condition=ConditionComboAnd(
            and_=[
                DateBoundCondition(
                    column="Transaction_date",
                    operator="from",
                    value=datetime(2009, 1, 2, tzinfo=ZoneInfo("UTC")),  # tz-aware
                ),
                DateBoundCondition(
                    column="Transaction_date",
                    operator="until",
                    value=datetime(2009, 1, 3),  # naive
                ),
            ]
        )
    )

    result = execute_filter(step=step, df=date_df).reset_index(drop=True)
    assert_frame_equal(expected_date_filter_result, result)

    # trying with string dates now
    step = FilterStep(
        condition=ConditionComboAnd(
            and_=[
                DateBoundCondition(
                    column="Transaction_date",
                    operator="from",
                    value="2009-01-02T00:00:00",  # naive
                ),
                DateBoundCondition(
                    column="Transaction_date",
                    operator="until",
                    value="2009-01-03T00:00:00+00:00",  # tz-aware
                ),
            ]
        )
    )

    result = execute_filter(step=step, df=date_df).reset_index(drop=True)
    assert_frame_equal(expected_date_filter_result, result)


def test_filter_step_with_variable_in_relative_date() -> None:
    raw = {
        "name": "filter",
        "condition": {
            "or": [
                {
                    "and": [
                        {
                            "column": "Date_firstDayOfMonth",
                            "value": "<%=appRequesters.date.start%>",
                            "operator": "from",
                        },
                        {
                            "column": "Date_firstDayOfMonth",
                            "value": "<%=appRequesters.date.end%>",
                            "operator": "until",
                        },
                    ]
                },
                {
                    "and": [
                        {
                            "column": "Date_firstDayOfMonth",
                            "value": {
                                "date": "<%=appRequesters.date.start%>",
                                "quantity": 1,
                                "duration": "year",
                                "operator": "until",
                            },
                            "operator": "from",
                        },
                        {
                            "column": "Date_firstDayOfMonth",
                            "value": {
                                "date": "<%=appRequesters.date.end%>",
                                "quantity": 1,
                                "duration": "year",
                                "operator": "until",
                            },
                            "operator": "until",
                        },
                    ]
                },
            ]
        },
    }

    step = FilterStepWithVariables(**raw)
    assert step.condition.or_[0].and_[0].value == "<%=appRequesters.date.start%>"
    assert all(isinstance(cond.value, RelativeDateWithVariables) for cond in step.condition.or_[1].and_)


def test_render_filter_step_with_variables(available_variables: dict[str, Any]) -> None:
    step = FilterStepWithVariables(
        condition={
            "column": "foo",
            "value": "{{ TODAY }}",
            "operator": "from",
        }
    )
    rendered = step.render(available_variables, nosql_apply_parameters_to_query)
    assert rendered.condition.value == available_variables["TODAY"]

    step = FilterStepWithVariables(
        condition={
            "column": "foo",
            "value": {
                "date": "{{ TODAY }}",
                "quantity": 1,
                "duration": "year",
                "operator": "until",
            },
            "operator": "from",
        }
    )
    rendered = step.render(available_variables, nosql_apply_parameters_to_query)
    assert rendered.condition.value.date == available_variables["TODAY"]

    step = FilterStepWithVariables(condition={"or": [step.model_dump()["condition"]]})
    rendered = step.render(available_variables, nosql_apply_parameters_to_query)
    assert rendered.condition.or_[0].value.date == available_variables["TODAY"]

    step = FilterStepWithVariables(condition={"column": "int_column", "operator": "in", "value": "{{ INTEGER_LIST }}"})
    rendered = step.render(available_variables, nosql_apply_parameters_to_query)
    assert rendered.condition.value == available_variables["INTEGER_LIST"] == [1, 2, 3]
