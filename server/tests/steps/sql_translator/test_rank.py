from weaverbird.backends.sql_translator.metadata import ColumnMetadata
from weaverbird.backends.sql_translator.steps import translate_rank
from weaverbird.pipeline.steps import RankStep


def test_translate_no_new_column_rank(query):
    step = RankStep(name='rank', value_col='RAICHU', order='asc', method='standard')
    query = translate_rank(
        step,
        query,
        index=1,
    )
    assert (
        query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), RANK_STEP_1 AS  (SELECT TOTO, RAICHU, FLORIZARRE, '
        '(RANK() OVER (ORDER BY RAICHU asc)) AS RAICHU_RANK FROM SELECT_STEP_0 ORDER BY RAICHU_RANK ASC)'
    )
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, RAICHU_RANK FROM RANK_STEP_1'
    assert query.query_name == 'RANK_STEP_1'

    # assert on metadatas
    assert query.metadata_manager.retrieve_query_metadata_columns() == {
        'RAICHU_RANK': ColumnMetadata(
            name='RAICHU_RANK',
            original_name='RAICHU_RANK',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
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


def test_translate_rank(query):
    step = RankStep(
        name='rank',
        value_col='RAICHU',
        order='asc',
        method='standard',
        new_column_name='DOUMBA',
    )
    query = translate_rank(
        step,
        query,
        index=1,
    )
    assert (
        query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), RANK_STEP_1 AS  (SELECT TOTO, RAICHU, FLORIZARRE, '
        '(RANK() OVER (ORDER BY RAICHU asc)) AS DOUMBA FROM SELECT_STEP_0 ORDER BY DOUMBA ASC)'
    )
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, DOUMBA FROM RANK_STEP_1'
    assert query.query_name == 'RANK_STEP_1'

    # assert on metadatas
    assert query.metadata_manager.retrieve_query_metadata_columns() == {
        'DOUMBA': ColumnMetadata(
            name='DOUMBA',
            original_name='DOUMBA',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
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


def test_translate_groupby_rank(query):
    step = RankStep(
        name='rank',
        value_col='RAICHU',
        order='asc',
        method='standard',
        groupby=['TOTO'],
        new_column_name='DOUMBA',
    )
    query = translate_rank(
        step,
        query,
        index=1,
    )
    assert (
        query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), RANK_STEP_1 AS  (SELECT TOTO, RAICHU, FLORIZARRE, '
        '(RANK() OVER (PARTITION BY TOTO ORDER BY RAICHU asc)) AS DOUMBA FROM SELECT_STEP_0 ORDER BY DOUMBA ASC, '
        'TOTO ASC)'
    )
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, DOUMBA FROM RANK_STEP_1'
    assert query.query_name == 'RANK_STEP_1'

    # assert on metadatas
    assert query.metadata_manager.retrieve_query_metadata_columns() == {
        'DOUMBA': ColumnMetadata(
            name='DOUMBA',
            original_name='DOUMBA',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
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
