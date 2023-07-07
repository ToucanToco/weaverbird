import glob
import json
from copy import deepcopy
from datetime import datetime

import pytest
from jinja2.nativetypes import NativeEnvironment
from pydantic import BaseModel
from toucan_connectors.common import nosql_apply_parameters_to_query

from weaverbird.pipeline.pipeline import (
    Pipeline,
    PipelineWithVariables,
    remove_void_conditions_from_filter_steps,
    remove_void_conditions_from_mongo_steps,
)
from weaverbird.pipeline.steps import DomainStep, RollupStep
from weaverbird.pipeline.steps.aggregate import Aggregation


class Case(BaseModel):
    filename: str
    data: dict
    context: dict
    expected_result: list


def jinja_renderer(query: dict | list[dict] | tuple | str, parameters: dict):
    if isinstance(query, dict):
        return {key: jinja_renderer(value, parameters) for key, value in deepcopy(query).items()}
    elif isinstance(query, list):
        rendered_query = [jinja_renderer(elt, parameters) for elt in deepcopy(query)]
        return rendered_query
    elif isinstance(query, tuple):
        return tuple(jinja_renderer(value, parameters) for value in deepcopy(query))
    elif isinstance(query, str):
        return NativeEnvironment().from_string(query).render(parameters)
    else:
        return query


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
    void_step = {
        "name": "filter",
        "condition": {"column": "colA", "operator": "ge", "value": "{{ __front_var_0__ }}"},
    }

    simple_filter_step = {
        "name": "filter",
        "condition": {"column": "colB", "operator": "eq", "value": "{{ __front_var_1__ }}"},
    }

    composed_filter_step_and_ = {
        "name": "filter",
        "condition": {
            "and_": [
                {"column": "colC", "operator": "gt", "value": "{{ __front_var_2__ }}"},
                {"column": "ColD", "operator": "until", "value": datetime(2009, 1, 3, 0, 0)},
            ]
        },
    }

    composed_filter_step_or_and_ = {
        "name": "filter",
        "condition": {
            "or_": [
                {"column": "colE", "operator": "eq", "value": "{{ __front_var_3__ }}"},
                {"column": "colF", "operator": "lt", "value": "{{ __front_var_4__ }}"},
                {
                    "and_": [
                        {"column": "colG", "operator": "gt", "value": "{{ __front_var_5__ }}"},
                        {"column": "colH", "operator": "eq", "value": "{{ __front_var_6__ }}"},
                        {
                            "or_": [
                                {"column": "colI", "operator": "eq", "value": "toto"},
                                {
                                    "column": "colJ",
                                    "operator": "eq",
                                    "value": "{{ __front_var_7__ }}",
                                },
                                {
                                    "or_": [
                                        {"column": "colM", "operator": "gt", "value": "__VOID__"},
                                        {"column": "colN", "operator": "le", "value": "__VOID__"},
                                        {
                                            "and_": [
                                                {
                                                    "column": "colO",
                                                    "operator": "eq",
                                                    "value": "__VOID__",
                                                },
                                            ]
                                        },
                                        {
                                            "column": "colP",
                                            "operator": "in",
                                            "value": [
                                                "__VOID__",
                                                "{{ __front_var_11__ }}",
                                            ],
                                        },
                                        {
                                            "column": "colQ",
                                            "operator": "nin",
                                            "value": [False, "{{ __front_var_10__ }}"],
                                        },
                                    ]
                                },
                            ]
                        },
                    ]
                },
            ]
        },
    }
    composed_filter_step_and_all_voids = {
        "name": "filter",
        "condition": {
            "and_": [
                {"column": "colK", "operator": "gt", "value": "{{ __front_var_8__ }}"},
                {"column": "colL", "operator": "le", "value": "{{ __front_var_9__ }}"},
            ]
        },
    }

    steps = [
        {"domain": "foobar", "name": "domain"},
        void_step,
        composed_filter_step_or_and_,
        simple_filter_step,
        composed_filter_step_and_,
        composed_filter_step_and_all_voids,
    ]
    variables = {
        "__front_var_0__": "__VOID__",
        "__front_var_1__": 32,
        "__front_var_2__": "__VOID__",
        "__front_var_3__": "TEST TEST",
        "__front_var_4__": "__VOID__",
        "__front_var_5__": "__VOID__",
        "__front_var_6__": "VALUE",
        "__front_var_7__": "TOTO",
        "__front_var_8__": "__VOID__",
        "__front_var_9__": "__VOID__",
        "__front_var_10__": "__VOID__",
        "__front_var_11__": True,
    }

    pipeline_with_variables = PipelineWithVariables(steps=steps)
    pipeline = pipeline_with_variables.render(variables, renderer=jinja_renderer)
    steps = remove_void_conditions_from_filter_steps(pipeline.steps)
    # will render the with no __VOID__ in step, whatever the depth
    assert [s.dict() for s in steps] == [
        {"name": "domain", "domain": "foobar"},
        {
            "name": "filter",
            "condition": {
                "or_": [
                    {"column": "colE", "operator": "eq", "value": "TEST TEST"},
                    {
                        "and_": [
                            {"column": "colH", "operator": "eq", "value": "VALUE"},
                            {
                                "or_": [
                                    {"column": "colI", "operator": "eq", "value": "toto"},
                                    {"column": "colJ", "operator": "eq", "value": "TOTO"},
                                    {
                                        "or_": [
                                            {"column": "colP", "operator": "in", "value": [True]},
                                            {"column": "colQ", "operator": "nin", "value": [False]},
                                        ]
                                    },
                                ]
                            },
                        ]
                    },
                ]
            },
        },
        {"name": "filter", "condition": {"column": "colB", "operator": "eq", "value": 32}},
        {
            "name": "filter",
            "condition": {
                "and_": [
                    {"column": "ColD", "operator": "until", "value": datetime(2009, 1, 3, 0, 0)}
                ]
            },
        },
    ]


def test_skip_void_parameter_from_variables_for_mongo_steps():
    assert remove_void_conditions_from_mongo_steps(
        [{"$match": {"STORE_TYPE": {"$eq": "__VOID__"}, "DOUM": {"$eq": "wut"}}}]
    ) == [{"$match": {"DOUM": {"$eq": "wut"}}}]

    assert remove_void_conditions_from_mongo_steps(
        [
            {
                "$match": {
                    "$ne": None,
                    "$and": [
                        {"$or": [{"property2": "value2"}, {"property3": {}}]},
                        {"$nor": [{"property4": {}}, {"property5": {}}]},
                    ],
                    "$or": [],
                    "$nor": [
                        {
                            "property9": {
                                "$and": [
                                    {
                                        "property7": {},
                                    }
                                ]
                            }
                        }
                    ],
                }
            }
        ]
    ) == [{"$match": {"$and": [{"$or": [{"property2": "value2"}]}], "$ne": None}}]

    assert remove_void_conditions_from_mongo_steps(
        [
            {
                "$match": {
                    "$eq": None,
                }
            },
            {"$group": {"_id": None, "_vqbPipelineInline": {"$push": "$$ROOT"}}},
            {
                "$lookup": {
                    "as": "_vqbPipelineToAppend_0",
                    "from": "slide_data-append",
                    "pipeline": [],
                }
            },
            {
                "$project": {
                    "_vqbPipelinesUnion": {
                        "$concatArrays": ["$_vqbPipelineInline", "$_vqbPipelineToAppend_0"]
                    }
                }
            },
            {"$unwind": "$_vqbPipelinesUnion"},
            {"$replaceRoot": {"newRoot": "$_vqbPipelinesUnion"}},
            {"$project": {"_id": 0}},
        ]
    ) == [
        {"$match": {"$eq": None}},
        {"$group": {"_id": None, "_vqbPipelineInline": {"$push": "$$ROOT"}}},
        {"$lookup": {"as": "_vqbPipelineToAppend_0", "from": "slide_data-append", "pipeline": []}},
        {
            "$project": {
                "_vqbPipelinesUnion": {
                    "$concatArrays": ["$_vqbPipelineInline", "$_vqbPipelineToAppend_0"]
                }
            }
        },
        {"$unwind": "$_vqbPipelinesUnion"},
        {"$replaceRoot": {"newRoot": "$_vqbPipelinesUnion"}},
        {"$project": {"_id": 0}},
    ]

    # to cover the rank query that have sometimes None values for prevRank
    assert remove_void_conditions_from_mongo_steps(
        [
            {"$match": {"domain": "cars"}},
            {"$sort": {"color": 1}},
            {"$group": {"_id": None, "_vqbArray": {"$push": "$$ROOT"}}},
            {
                "$project": {
                    "_vqbSortedArray": {
                        "$let": {
                            "vars": {
                                "reducedArrayInObj": {
                                    "$reduce": {
                                        "input": "$_vqbArray",
                                        "initialValue": {
                                            "a": [],
                                            "order": 0,
                                            "prevValue": None,
                                            "prevRank": None,
                                        },
                                        "in": {
                                            "$let": {
                                                "vars": {
                                                    "order": {
                                                        "$cond": [
                                                            {
                                                                "$ne": [
                                                                    "$$this.color",
                                                                    "$$value.prevValue",
                                                                ]
                                                            },
                                                            {"$add": ["$$value.order", 1]},
                                                            "$$value.order",
                                                        ]
                                                    },
                                                    "rank": {
                                                        "$cond": [
                                                            {
                                                                "$ne": [
                                                                    "$$this.color",
                                                                    "$$value.prevValue",
                                                                ]
                                                            },
                                                            {"$add": ["$$value.order", 1]},
                                                            "$$value.prevRank",
                                                        ]
                                                    },
                                                },
                                                "in": {
                                                    "a": {
                                                        "$concatArrays": [
                                                            "$$value.a",
                                                            [
                                                                {
                                                                    "$mergeObjects": [
                                                                        "$$this",
                                                                        {"color-rank": "$$rank"},
                                                                    ]
                                                                }
                                                            ],
                                                        ]
                                                    },
                                                    "order": "$$order",
                                                    "prevValue": "$$this.color",
                                                    "prevRank": "$$rank",
                                                },
                                            }
                                        },
                                    }
                                }
                            },
                            "in": "$$reducedArrayInObj.a",
                        }
                    }
                }
            },
            {"$unwind": "$_vqbSortedArray"},
            {"$replaceRoot": {"newRoot": "$_vqbSortedArray"}},
        ]
    ) == [
        {"$match": {"domain": "cars"}},
        {"$sort": {"color": 1}},
        {"$group": {"_id": None, "_vqbArray": {"$push": "$$ROOT"}}},
        {
            "$project": {
                "_vqbSortedArray": {
                    "$let": {
                        "in": "$$reducedArrayInObj.a",
                        "vars": {
                            "reducedArrayInObj": {
                                "$reduce": {
                                    "in": {
                                        "$let": {
                                            "in": {
                                                "a": {
                                                    "$concatArrays": [
                                                        "$$value.a",
                                                        [
                                                            {
                                                                "$mergeObjects": [
                                                                    "$$this",
                                                                    {"color-rank": "$$rank"},
                                                                ]
                                                            }
                                                        ],
                                                    ]
                                                },
                                                "order": "$$order",
                                                "prevRank": "$$rank",
                                                "prevValue": "$$this.color",
                                            },
                                            "vars": {
                                                "order": {
                                                    "$cond": [
                                                        {
                                                            "$ne": [
                                                                "$$this.color",
                                                                "$$value.prevValue",
                                                            ]
                                                        },
                                                        {"$add": ["$$value.order", 1]},
                                                        "$$value.order",
                                                    ]
                                                },
                                                "rank": {
                                                    "$cond": [
                                                        {
                                                            "$ne": [
                                                                "$$this.color",
                                                                "$$value.prevValue",
                                                            ]
                                                        },
                                                        {"$add": ["$$value.order", 1]},
                                                        "$$value.prevRank",
                                                    ]
                                                },
                                            },
                                        }
                                    },
                                    "initialValue": {
                                        "order": 0,
                                        "prevRank": None,
                                        "prevValue": None,
                                    },
                                    "input": "$_vqbArray",
                                }
                            }
                        },
                    }
                }
            }
        },
        {"$unwind": "$_vqbSortedArray"},
        {"$replaceRoot": {"newRoot": "$_vqbSortedArray"}},
    ]
