import glob
import json
from datetime import datetime

import pytest
from pydantic import BaseModel
from toucan_connectors.common import nosql_apply_parameters_to_query

from weaverbird.pipeline.conditions import (
    ComparisonCondition,
    ConditionComboAnd,
    ConditionComboOr,
    DateBoundCondition,
)
from weaverbird.pipeline.pipeline import Pipeline, PipelineWithVariables
from weaverbird.pipeline.steps import DomainStep, RollupStep
from weaverbird.pipeline.steps.aggregate import Aggregation
from weaverbird.pipeline.steps.filter import FilterStep


class Case(BaseModel):
    filename: str
    data: dict
    context: dict
    expected_result: list


def get_render_variables_test_cases():
    test_cases = []
    globs = glob.glob("./tests/fixtures/fixtures_templating/*.json")
    for file in globs:
        with open(file) as json_file:
            file_content = json.load(json_file)
            for test in file_content:
                case = Case(filename=file, data=test[0], context=test[1], expected_result=test[2])
                test_cases.append(case)
    return test_cases


cases = get_render_variables_test_cases()
ids = map(lambda x: x.filename, cases)


@pytest.mark.parametrize("case", cases, ids=ids)
def test_step_with_variables(case: Case):
    pipeline_with_variables = PipelineWithVariables(**case.data)

    pipeline = pipeline_with_variables.render(
        case.context, renderer=nosql_apply_parameters_to_query
    )

    expected_result = Pipeline(steps=case.expected_result)
    assert pipeline == expected_result


def test_custom_sql_step_with_variables():
    steps = [{"name": "customsql", "query": "{{ __front_var_0__ }}"}]
    variables = {"__front_var_0__": "-- DROP TABLE users;"}

    pipeline_with_variables = PipelineWithVariables(steps=steps)
    pipeline = pipeline_with_variables.render(variables, renderer=nosql_apply_parameters_to_query)

    # It should not have been rendered:
    assert pipeline.steps[0].query == "{{ __front_var_0__ }}"


def test_to_dict():
    pipeline = Pipeline(
        steps=[
            DomainStep(name="domain", domain="foobar"),
            RollupStep(
                name="rollup",
                hierarchy=["a", "b"],
                aggregations=[Aggregation(newcolumns=["a"], aggfunction="sum", columns=["a"])],
            ),
        ]
    )

    actual_dict = pipeline.dict()

    expected_dict = {
        "steps": [
            {"domain": "foobar", "name": "domain"},
            {
                "name": "rollup",
                "hierarchy": ["a", "b"],
                "aggregations": [{"new_columns": ["a"], "agg_function": "sum", "columns": ["a"]}],
            },
        ]
    }
    assert actual_dict == expected_dict
    assert pipeline == Pipeline(**pipeline.dict())


def test_skip_void_parameter_from_variables():
    void_step = FilterStep(
        name="filter",
        condition=ComparisonCondition(
            column="colA",
            operator="ge",
            value="{{ __front_var_0__ }}",
        ),
    )

    simple_filter_step = FilterStep(
        name="filter",
        condition=ComparisonCondition(
            column="colB",
            operator="eq",
            value="{{ __front_var_1__ }}",
        ),
    )

    composed_filter_step_and_ = FilterStep(
        condition=ConditionComboAnd(
            and_=[
                ComparisonCondition(
                    column="colC",
                    operator="gt",
                    value="{{ __front_var_2__ }}",
                ),
                DateBoundCondition(
                    column="Transaction_date",
                    operator="until",
                    value=datetime(2009, 1, 3),  # naive
                ),
            ]
        )
    )

    composed_filter_step_or_ = FilterStep(
        condition=ConditionComboOr(
            or_=[
                ComparisonCondition(
                    column="colA",
                    operator="eq",
                    value="{{ __front_var_3__ }}",
                ),
                ComparisonCondition(
                    column="colX",
                    operator="lt",
                    value="{{ __front_var_4__ }}",
                ),
                ComparisonCondition(
                    column="colA",
                    operator="eq",
                    value="toto",
                ),
            ],
        ),
    )
    steps = [
        {"domain": "foobar", "name": "domain"},
        void_step,
        composed_filter_step_or_,
        simple_filter_step,
        composed_filter_step_and_,
    ]
    variables = {
        "__front_var_0__": "__VOID__",
        "__front_var_1__": 32,
        "__front_var_2__": "__VOID__",
        "__front_var_3__": "TEST TEST",
        "__front_var_4__": "__VOID__",
    }

    pipeline_with_variables = PipelineWithVariables(steps=steps)
    pipeline = pipeline_with_variables.render(variables, renderer=nosql_apply_parameters_to_query)

    # It should not have been rendered:
    assert pipeline.steps == [
        {"name": "domain", "domain": "foobar"},
        {
            "name": "filter",
            "condition": {
                "or_": [
                    {"column": "colA", "operator": "eq", "value": "TEST TEST"},
                    {"column": "colA", "operator": "eq", "value": "toto"},
                ]
            },
        },
        {"name": "filter", "condition": {"column": "colB", "operator": "eq", "value": 32}},
        {
            "name": "filter",
            "condition": {
                "and_": [
                    {
                        "column": "Transaction_date",
                        "operator": "until",
                        "value": datetime(2009, 1, 3, 0, 0),
                    },
                ]
            },
        },
    ]
