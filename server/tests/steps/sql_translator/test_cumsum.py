from weaverbird.backends.sql_translator.metadata import ColumnMetadata
from weaverbird.backends.sql_translator.steps import translate_cumsum
from weaverbird.pipeline.steps import CumSumStep


def test_translate_cumsum_legacy_syntax(query):
    step = CumSumStep(
        name='cumsum',
        value_column='TOTO',
        reference_column='RAICHU',
        groupby=[],
        new_column='TOTO_CUMSUM_CUSTOM',
    )
    query = translate_cumsum(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), CUMSUM_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        'SUM(TOTO) OVER (PARTITION BY NULL ORDER BY RAICHU ASC rows UNBOUNDED PRECEDING) TOTO_CUMSUM_CUSTOM FROM '
        'SELECT_STEP_0 ORDER BY RAICHU ASC)'
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query
        == 'SELECT TOTO, RAICHU, FLORIZARRE, TOTO_CUMSUM_CUSTOM FROM CUMSUM_STEP_1'
    )
    assert query.query_name == 'CUMSUM_STEP_1'
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
        'TOTO_CUMSUM_CUSTOM': ColumnMetadata(
            name='TOTO_CUMSUM_CUSTOM',
            original_name='TOTO_CUMSUM_CUSTOM',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
    }


def test_translate_cumsum(query):
    step = CumSumStep(
        name='cumsum',
        to_cumsum=[['TOTO', 'TOTO_CUMSUM_CUSTOM']],
        reference_column='RAICHU',
        groupby=[],
    )
    query = translate_cumsum(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), CUMSUM_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        'SUM(TOTO) OVER (PARTITION BY NULL ORDER BY RAICHU ASC rows UNBOUNDED PRECEDING) TOTO_CUMSUM_CUSTOM FROM '
        'SELECT_STEP_0 ORDER BY RAICHU ASC)'
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query
        == 'SELECT TOTO, RAICHU, FLORIZARRE, TOTO_CUMSUM_CUSTOM FROM CUMSUM_STEP_1'
    )
    assert query.query_name == 'CUMSUM_STEP_1'
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
        'TOTO_CUMSUM_CUSTOM': ColumnMetadata(
            name='TOTO_CUMSUM_CUSTOM',
            original_name='TOTO_CUMSUM_CUSTOM',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
    }


def test_translate_no_new_column_name_cumsum(query):
    step = CumSumStep(
        name='cumsum',
        to_cumsum=[['TOTO', '']],
        reference_column='RAICHU',
        groupby=[],
    )
    query = translate_cumsum(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), CUMSUM_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        'SUM(TOTO) OVER (PARTITION BY NULL ORDER BY RAICHU ASC rows UNBOUNDED PRECEDING) TOTO_CUMSUM FROM '
        'SELECT_STEP_0 ORDER BY RAICHU ASC)'
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, TOTO_CUMSUM FROM CUMSUM_STEP_1'
    )
    assert query.query_name == 'CUMSUM_STEP_1'
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
        'TOTO_CUMSUM': ColumnMetadata(
            name='TOTO_CUMSUM',
            original_name='TOTO_CUMSUM',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
    }


def test_translate_groupby_cumsum(query):
    step = CumSumStep(
        name='cumsum',
        to_cumsum=[['TOTO', '']],
        reference_column='RAICHU',
        groupby=['FLORIZARRE'],
    )
    query = translate_cumsum(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), CUMSUM_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        'SUM(TOTO) OVER (PARTITION BY FLORIZARRE ORDER BY RAICHU ASC rows UNBOUNDED PRECEDING) TOTO_CUMSUM FROM '
        'SELECT_STEP_0 ORDER BY RAICHU ASC)'
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, TOTO_CUMSUM FROM CUMSUM_STEP_1'
    )
    assert query.query_name == 'CUMSUM_STEP_1'
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
        'TOTO_CUMSUM': ColumnMetadata(
            name='TOTO_CUMSUM',
            original_name='TOTO_CUMSUM',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
    }
