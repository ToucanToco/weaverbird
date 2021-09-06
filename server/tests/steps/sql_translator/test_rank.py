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
        == "WITH SELECT_STEP_0 AS (SELECT * FROM products), RANK_STEP_1 AS  (SELECT TOTO, RAICHU, FLORIZARRE, "
           "(RANK() OVER (ORDER BY RAICHU asc)) AS RAICHU_RANK FROM SELECT_STEP_0)"
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
            type='STR',
            original_type='str',
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
            type='STR',
            original_type='str',
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
        new_column_name="DOUMBA",
    )
    query = translate_rank(
        step,
        query,
        index=1,
    )
    assert (
        query.transformed_query
        == "WITH SELECT_STEP_0 AS (SELECT * FROM products), RANK_STEP_1 AS  (SELECT TOTO, RAICHU, FLORIZARRE, "
           "(RANK() OVER (ORDER BY RAICHU asc)) AS DOUMBA FROM SELECT_STEP_0)"
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
            type='STR',
            original_type='str',
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
            type='STR',
            original_type='str',
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
        groupby=["TOTO"],
        new_column_name="DOUMBA",
    )
    query = translate_rank(
        step,
        query,
        index=1,
    )
    assert (
        query.transformed_query
        == "WITH SELECT_STEP_0 AS (SELECT * FROM products), RANK_STEP_1 AS (SELECT * FROM (SELECT TOTO AS "
        "SUB_FIELD_04C1_0, RAICHU AS SUB_FIELD_3A4D_1 , (RANK() OVER (ORDER BY RAICHU asc)) AS DOUMBA FROM "
        "SELECT_STEP_0 GROUP BY SUB_FIELD_04C1_0, SUB_FIELD_3A4D_1) B INNER JOIN SELECT_STEP_0 A ON (("
        "SUB_FIELD_04C1_0 = A.TOTO) AND (SUB_FIELD_3A4D_1 = A.RAICHU)))"
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
            type='STR',
            original_type='str',
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
            type='STR',
            original_type='str',
            alias=None,
            delete=False,
        ),
    }
