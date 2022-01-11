from weaverbird.backends.sql_translator.metadata import ColumnMetadata
from weaverbird.backends.sql_translator.steps import translate_concatenate
from weaverbird.pipeline.steps import ConcatenateStep


def test_translate_simple_concatenate(query):
    step = ConcatenateStep(
        name='concatenate', columns=['TOTO', 'AGE'], separator=',', new_column_name='TO_AGE'
    )

    query = translate_concatenate(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), CONCATENATE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, "
        "CONCAT_WS(',', TOTO, AGE) AS TO_AGE FROM SELECT_STEP_0)"
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, TO_AGE FROM CONCATENATE_STEP_1'
    )
    assert query.query_name == 'CONCATENATE_STEP_1'

    # assert on metadatas
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
        'TO_AGE': ColumnMetadata(
            name='TO_AGE',
            original_name='TO_AGE',
            type='STRING',
            original_type='string',
            alias=None,
            delete=False,
        ),
    }
