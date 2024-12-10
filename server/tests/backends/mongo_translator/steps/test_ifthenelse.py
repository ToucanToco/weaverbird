from weaverbird.backends.mongo_translator.steps import translate_ifthenelse
from weaverbird.pipeline.conditions import ComparisonCondition
from weaverbird.pipeline.steps import IfthenelseStep
from weaverbird.pipeline.steps.ifthenelse import IfThenElse


def test_ifthenelse_basic():
    assert translate_ifthenelse(
        step=IfthenelseStep(
            newColumn="foobar",
            condition=ComparisonCondition(column="foo", operator="eq", value=1),
            then=1,
            else_value=2,
        )
    ) == [
        {
            "$addFields": {
                "foobar": {
                    "$cond": {
                        "if": {"$eq": ["$foo", 1]},
                        "then": {
                            "$ifNull": [
                                1,
                                None,
                            ]
                        },
                        "else": {
                            "$ifNull": [
                                2,
                                None,
                            ]
                        },
                    }
                }
            }
        }
    ]


def test_ifthenelse_formulas():
    assert translate_ifthenelse(
        step=IfthenelseStep(
            newColumn="foobar",
            condition=ComparisonCondition(column="foo", operator="eq", value=1),
            then="foo * 2",
            else_value="foo / (foo + 1)",
        )
    ) == [
        {
            "$addFields": {
                "foobar": {
                    "$cond": {
                        "if": {"$eq": ["$foo", 1]},
                        "then": {"$ifNull": [{"$multiply": ["$foo", 2]}, None]},
                        "else": {
                            "$ifNull": [
                                {
                                    "$cond": [
                                        {"$in": [{"$add": ["$foo", 1]}, [0, None]]},
                                        None,
                                        {"$divide": ["$foo", {"$add": ["$foo", 1]}]},
                                    ]
                                },
                                None,
                            ]
                        },
                    },
                }
            }
        }
    ]


def test_ifthenelse_nested_else():
    assert translate_ifthenelse(
        step=IfthenelseStep(
            newColumn="foobar",
            condition=ComparisonCondition(column="foo", operator="eq", value=1),
            then="foo * 2",
            else_value=IfThenElse(
                condition=ComparisonCondition(column="foo", operator="gt", value=2),
                then="foo % 2",
                else_value="foo % 3",
            ),
        )
    ) == [
        {
            "$addFields": {
                "foobar": {
                    "$cond": {
                        "if": {"$eq": ["$foo", 1]},
                        "then": {"$ifNull": [{"$multiply": ["$foo", 2]}, None]},
                        "else": {
                            "$ifNull": [
                                {
                                    "$cond": {
                                        "if": {"$gt": ["$foo", 2]},
                                        "then": {
                                            "$ifNull": [
                                                {
                                                    "$cond": [
                                                        {"$in": [2, [0, None]]},
                                                        None,
                                                        {"$mod": ["$foo", 2]},
                                                    ]
                                                },
                                                None,
                                            ]
                                        },
                                        "else": {
                                            "$ifNull": [
                                                {
                                                    "$cond": [
                                                        {"$in": [3, [0, None]]},
                                                        None,
                                                        {"$mod": ["$foo", 3]},
                                                    ]
                                                },
                                                None,
                                            ],
                                        },
                                    }
                                },
                                None,
                            ]
                        },
                    }
                }
            }
        }
    ]
