import pytest

from weaverbird.backends.sql_translator.steps import translate_ifthenelse
from weaverbird.backends.sql_translator.types import SQLQuery, SqlQueryMetadataManager
from weaverbird.pipeline.conditions import (
    ComparisonCondition,
    ConditionComboAnd,
    ConditionComboOr,
    MatchCondition,
)
from weaverbird.pipeline.steps import IfthenelseStep


@pytest.fixture
def query():
    return SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT toto, raichu, florizarre FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={'table1': {'toto': 'str', 'raichu': 'int', 'florizarre': 'str'}}
        ),
    )


def test_simple_condition_integer(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'column': 'raichu',
                'value': 10,
                'operator': 'gt',
            },
            'newColumn': 'cond',
            'then': '\'tintin\'',
            'else': '\'anime\'',
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT toto, raichu, florizarre,  '
        'IFF(raichu > 10, \'tintin\', \'anime\') AS cond FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre, cond FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_simple_condition_strings(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'column': 'toto',
                'value': '\'okok\'',
                'operator': 'eq',
            },
            'newColumn': 'cond',
            'then': '\'azoram\'',
            'else': '\'zigolo\'',
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT toto, raichu, florizarre,  '
        'IFF(toto = \'okok\', \'azoram\', \'zigolo\') AS cond FROM SELECT_STEP_0) '
    )

    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre, cond FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_and_condition(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'and': [
                    {
                        'column': 'raichu',
                        'value': 10,
                        'operator': 'gt',
                    },
                    {
                        'column': 'toto',
                        'value': '\'ogadoka\'',
                        'operator': 'matches',
                    },
                ],
            },
            'newColumn': 'cond',
            'then': '\'tintin\'',
            'else': '\'anime\'',
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT toto, raichu, florizarre,  '
        'IFF((raichu > 10 AND toto LIKE \'ogadoka\'), \'tintin\', \'anime\') AS cond FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre, cond FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_or_condition(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'or': [
                    {
                        'column': 'raichu',
                        'value': 10,
                        'operator': 'lt',
                    },
                    {
                        'column': 'raichu',
                        'value': 1,
                        'operator': 'ge',
                    },
                ],
            },
            'newColumn': 'cond',
            'then': '\'tintin\'',
            'else': '\'anime\'',
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT toto, raichu, florizarre,  '
        'IFF((raichu < 10 OR raichu >= 1), \'tintin\', \'anime\') AS cond FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre, cond FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_then_should_support_nested_else(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'newColumn': 'cond1',
            'if': {
                'or': [
                    {
                        'column': 'raichu',
                        'value': 10,
                        'operator': 'lt',
                    },
                    {
                        'column': 'raichu',
                        'value': 1,
                        'operator': 'ge',
                    },
                ],
            },
            'then': 3,
            'else': {
                'if': {'column': 'toto', 'value': '\'zigar\'', 'operator': 'matches'},
                'newColumn': 'cond2',
                'then': 1,
                'else': {
                    'if': {'column': 'florizarre', 'value': '\'gokar\'', 'operator': 'eq'},
                    'then': 2,
                    'newColumn': 'cond3',
                    'else': {
                        'if': {'column': 'toto', 'value': '\'ok\'', 'operator': 'ne'},
                        'then': 7,
                        'newColumn': 'cond3',
                        'else': {
                            'if': {
                                'column': 'florizarre',
                                'value': ['ok'],
                                'operator': 'in',
                            },
                            'then': 7,
                            'newColumn': 'cond3',
                            'else': 0,
                        },
                    },
                },
            },
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )

    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT toto, raichu, florizarre,  '
        'IFF((raichu < 10 OR raichu >= 1), 3, IFF(toto LIKE \'zigar\', 1, IFF(florizarre = \'gokar\', 2, IFF(toto != '
        '\'ok\', 7, IFF(florizarre IN (\'ok\'), 7, 0))))) AS cond1 FROM SELECT_STEP_0) '
    )

    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre, cond1 FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'
