from weaverbird.backends.sql_translator.metadata import ColumnMetadata
from weaverbird.backends.sql_translator.steps import translate_argmin
from weaverbird.pipeline.steps import ArgminStep


def test_translate_argmin(query):
    step = ArgminStep(name='argmin', column='TOTO', groups=[])
    query = translate_argmin(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), ARGMIN_STEP_1 AS (SELECT * FROM (SELECT MIN(TOTO) AS '
        'TOTO_ALIAS_A FROM SELECT_STEP_0) A INNER JOIN SELECT_STEP_0 B ON A.TOTO_ALIAS_A=B.TOTO)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM ARGMIN_STEP_1'
    assert query.query_name == 'ARGMIN_STEP_1'
    # metadatas
    assert query.metadata_manager.retrieve_query_metadata_columns() == {
        'FLORIZARRE': ColumnMetadata(
            name='FLORIZARRE',
            original_name='FLORIZARRE',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'RAICHU': ColumnMetadata(
            name='RAICHU',
            original_name='RAICHU',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'TOTO': ColumnMetadata(
            name='TOTO',
            original_name='TOTO',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
    }


def test_translate_groupby_argmin(query):
    step = ArgminStep(name='argmin', column='TOTO', groups=['FLORIZARRE'])
    query = translate_argmin(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), ARGMIN_STEP_1 AS (SELECT * FROM (SELECT FLORIZARRE AS '
        'FLORIZARRE_ALIAS_A, MIN(TOTO) AS TOTO_ALIAS_A FROM SELECT_STEP_0 GROUP BY FLORIZARRE_ALIAS_A) A INNER JOIN '
        'SELECT_STEP_0 B ON A.FLORIZARRE_ALIAS_A=B.FLORIZARRE AND A.TOTO_ALIAS_A=B.TOTO)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM ARGMIN_STEP_1'
    assert query.query_name == 'ARGMIN_STEP_1'
    # metadatas
    assert query.metadata_manager.retrieve_query_metadata_columns() == {
        'FLORIZARRE': ColumnMetadata(
            name='FLORIZARRE',
            original_name='FLORIZARRE',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'RAICHU': ColumnMetadata(
            name='RAICHU',
            original_name='RAICHU',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'TOTO': ColumnMetadata(
            name='TOTO',
            original_name='TOTO',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
    }
