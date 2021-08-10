import pytest

from weaverbird.backends.sql_translator.steps import translate_ifthenelse
from weaverbird.backends.sql_translator.types import SQLQuery, SqlQueryMetadataManager
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
                'column': 'int',
                'value': 10,
                'operator': 'gt',
            },
            'newColumn': 'cond',
            'then': '\'tintin\'',
            'else': '\'anime\'',
        }
    )
    step.condition = 'raichu > 10'
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT (IF(raichu > 10, \'tintin\', '
        '\'anime\')) AS cond) FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_simple_condition_strings(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'column': 'toto',
                'value': 'okok',
                'operator': 'eq',
            },
            'newColumn': 'cond',
            'then': '\'azoram\'',
            'else': '\'zigolo\'',
        }
    )
    step.condition = 'toto = \'okok\''
    query = translate_ifthenelse(
        step,
        query,
        index=2,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_2 AS (SELECT (IF(toto = \'okok\', '
        '\'azoram\', \'zigolo\')) AS cond) FROM SELECT_STEP_0) '
    )

    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre FROM IFTHENELSE_STEP_2'
    assert query.query_name == 'IFTHENELSE_STEP_2'


def test_then_should_support_nested_else(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'newColumn': 'cond1',
            'if': {'column': 'raichu', 'value': 3, 'operator': 'lt'},
            'then': 3,
            'else': IfthenelseStep(
                **{
                    'if': {'column': 'toto', 'value': '\'zigar\'', 'operator': 'eq'},
                    'newColumn': 'cond2',
                    'then': 1,
                    'else': IfthenelseStep(
                        **{
                            'if': {'column': 'florizarre', 'value': '\'gokar\'', 'operator': 'eq'},
                            'then': 2,
                            'newColumn': 'cond3',
                            'else': 0,
                        }
                    ),
                }
            ),
        }
    )
    # TODO : Really strange, i needed to reset manually conditions here,
    #  because i was getting weird results like
    step.condition = 'raichu < 3'
    step.else_value.condition = 'toto = \'zigar\''
    step.else_value.else_value.condition = 'florizarre = \'gokar\''

    query = translate_ifthenelse(
        step,
        query,
        index=3,
    )

    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_3 AS (SELECT (IF(raichu < 3, 3, IF(toto = '
        '\'zigar\', 1, IF(florizarre = \'gokar\', 2, 0)))) AS cond1) FROM SELECT_STEP_0) '
    )

    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre FROM IFTHENELSE_STEP_3'
    assert query.query_name == 'IFTHENELSE_STEP_3'
