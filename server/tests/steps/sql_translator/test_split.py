from weaverbird.backends.sql_translator.metadata import ColumnMetadata
from weaverbird.backends.sql_translator.steps import translate_split
from weaverbird.pipeline.steps import SplitStep


def test_translate_simple_split(query):
    step = SplitStep(
        name='split',
        column='TOTO',
        delimiter=',',
        number_cols_to_keep=2,
    )
    query = translate_split(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), SPLIT_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, "
        "SPLIT_PART(TOTO, ',', 1) AS TOTO_1, SPLIT_PART(TOTO, ',', 2) AS TOTO_2 FROM SELECT_STEP_0)"
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, TOTO_1, TOTO_2 FROM SPLIT_STEP_1'
    )
    assert query.query_name == 'SPLIT_STEP_1'

    # assert on metadata
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
        'TOTO_1': ColumnMetadata(
            name='TOTO_1',
            original_name='TOTO_1',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'TOTO_2': ColumnMetadata(
            name='TOTO_2',
            original_name='TOTO_2',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
    }


def test_translate_quotes_as_delimiter_split(query):
    step = SplitStep(
        name='split',
        column='TOTO',
        delimiter="'",
        number_cols_to_keep=1,
    )
    query = translate_split(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), SPLIT_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, "
        "SPLIT_PART(TOTO, '\\'', 1) AS TOTO_1 FROM SELECT_STEP_0)"
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, TOTO_1 FROM SPLIT_STEP_1'
    assert query.query_name == 'SPLIT_STEP_1'

    # assert on metadata
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
        'TOTO_1': ColumnMetadata(
            name='TOTO_1',
            original_name='TOTO_1',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
    }
