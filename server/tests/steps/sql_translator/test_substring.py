from weaverbird.backends.sql_translator.metadata import ColumnMetadata
from weaverbird.backends.sql_translator.steps import translate_substring
from weaverbird.pipeline.steps import SubstringStep


def test_translate_substring_no_new_column(query):
    step = SubstringStep(
        name='substring',
        column='TOTO',
        start_index=1,
        end_index=3,
    )
    query = translate_substring(
        step,
        query,
        index=1,
    )
    assert (
        query.transformed_query
        == "WITH SELECT_STEP_0 AS (SELECT * FROM products), SUBSTRING_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, "
        "SUBSTR(TOTO, 1, 3) AS TOTO_SUBSTR FROM SELECT_STEP_0)"
    )
    assert (
        query.selection_query
        == 'SELECT TOTO, RAICHU, FLORIZARRE, TOTO_SUBSTR FROM SUBSTRING_STEP_1'
    )
    assert query.query_name == 'SUBSTRING_STEP_1'

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
        'TOTO_SUBSTR': ColumnMetadata(
            name='TOTO_SUBSTR',
            original_name='TOTO_SUBSTR',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
    }


def test_translate_substring(query):
    step = SubstringStep(
        name='substring',
        column='TOTO',
        new_column_name='TOTO_NEW',
        start_index=1,
        end_index=3,
    )
    query = translate_substring(
        step,
        query,
        index=1,
    )
    assert (
        query.transformed_query
        == "WITH SELECT_STEP_0 AS (SELECT * FROM products), SUBSTRING_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, "
        "SUBSTR(TOTO, 1, 3) AS TOTO_NEW FROM SELECT_STEP_0)"
    )
    assert (
        query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, TOTO_NEW FROM SUBSTRING_STEP_1'
    )
    assert query.query_name == 'SUBSTRING_STEP_1'

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
        'TOTO_NEW': ColumnMetadata(
            name='TOTO_NEW',
            original_name='TOTO_NEW',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
    }


def test_translate_substring_negative_index(query):
    step = SubstringStep(
        name='substring',
        column='TOTO',
        start_index=-7,
        end_index=-4,
    )
    query = translate_substring(
        step,
        query,
        index=1,
    )
    assert (
        query.transformed_query
        == "WITH SELECT_STEP_0 AS (SELECT * FROM products), SUBSTRING_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, "
        "SUBSTR(TOTO, (LENGTH (TOTO) -7), (LENGTH (TOTO) -4)) AS TOTO_SUBSTR FROM SELECT_STEP_0)"
    )
    assert (
        query.selection_query
        == 'SELECT TOTO, RAICHU, FLORIZARRE, TOTO_SUBSTR FROM SUBSTRING_STEP_1'
    )
    assert query.query_name == 'SUBSTRING_STEP_1'

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
        'TOTO_SUBSTR': ColumnMetadata(
            name='TOTO_SUBSTR',
            original_name='TOTO_SUBSTR',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
    }
