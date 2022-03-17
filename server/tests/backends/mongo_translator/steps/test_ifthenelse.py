from weaverbird.backends.mongo_translator.steps import translate_ifthenelse
from weaverbird.pipeline.conditions import ComparisonCondition
from weaverbird.pipeline.steps import IfthenelseStep
from weaverbird.pipeline.steps.ifthenelse import IfThenElse


def test_ifthenelse_basic():
    assert translate_ifthenelse(
        step=IfthenelseStep(
            newColumn='foobar',
            condition=ComparisonCondition(column='foo', operator='eq', value=1),
            then=1,
            else_value=2,
        ),
        unsupported_operators_in_conditions=[],
    ) == {'$cond': {'if': {'$eq': ['$foo', 1]}, 'then': 1, 'else': 2}}


def test_ifthenelse_formulas():
    assert translate_ifthenelse(
        step=IfthenelseStep(
            newColumn='foobar',
            condition=ComparisonCondition(column='foo', operator='eq', value=1),
            then='foo * 2',
            else_value='foo / (foo + 1)',
        ),
        unsupported_operators_in_conditions=[],
    ) == {
        '$cond': {
            'if': {'$eq': ['$foo', 1]},
            'then': {'$multiply': ['$foo', 2]},
            'else': {
                '$cond': [
                    {'$in': [{'$add': ['$foo', 1]}, [0, None]]},
                    None,
                    {'$divide': ['$foo', {'$add': ['$foo', 1]}]},
                ]
            },
        },
    }


def test_ifthenelse_nested_else():
    assert translate_ifthenelse(
        step=IfthenelseStep(
            newColumn='foobar',
            condition=ComparisonCondition(column='foo', operator='eq', value=1),
            then='foo * 2',
            else_value=IfThenElse(
                condition=ComparisonCondition(column='foo', operator='gt', value=2),
                then='foo**2',
                else_value='foo**3',
            ),
        ),
        unsupported_operators_in_conditions=[],
    ) == {
        '$cond': {
            'if': {'$eq': ['$foo', 1]},
            'then': {'$multiply': ['$foo', 2]},
            'else': {
                '$cond': {
                    'if': {'$gt': ['$foo', 2]},
                    'then': {'$pow': ['$foo', 2]},
                    'else': {'$pow': ['$foo', 3]},
                }
            },
        },
    }
