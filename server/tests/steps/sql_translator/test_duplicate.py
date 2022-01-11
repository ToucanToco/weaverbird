from weaverbird.backends.sql_translator.metadata import ColumnMetadata
from weaverbird.backends.sql_translator.steps import translate_duplicate
from weaverbird.pipeline.steps import DuplicateStep


def test_translate_simple_duplicate(query):
    step = DuplicateStep(name='duplicate', column='TOTO', new_column_name='TOTO_NAME')
    query = translate_duplicate(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), DUPLICATE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        'TOTO AS TOTO_NAME FROM SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, TOTO_NAME FROM DUPLICATE_STEP_1'
    )
    assert query.query_name == 'DUPLICATE_STEP_1'

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
        'TOTO_NAME': ColumnMetadata(
            name='TOTO_NAME',
            original_name='TOTO_NAME',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
    }


def test_translate_column_name_already_present_duplicate(query):
    step = DuplicateStep(name='duplicate', column='RAICHU', new_column_name='TOTO')
    query = translate_duplicate(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), DUPLICATE_STEP_1 AS (SELECT RAICHU, FLORIZARRE, RAICHU AS '
        'TOTO FROM SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM DUPLICATE_STEP_1'
    assert query.query_name == 'DUPLICATE_STEP_1'
    # we test metadata
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
            type='INT',
            original_type='INT',
            alias=None,
            delete=False,
        ),
    }
