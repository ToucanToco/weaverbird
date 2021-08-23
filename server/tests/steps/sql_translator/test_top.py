from weaverbird.backends.sql_translator.steps import translate_top
from weaverbird.pipeline.steps import TopStep


def test_translate_top(query):
    step = TopStep(name='top', groups=['TOTO', 'FLORIZARRE'], rank_on='RAICHU', sort='asc', limit=3)

    query = translate_top(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), TOPN_STEP_1 AS (SELECT TOTO, FLORIZARRE, TOP 3 RAICHU FROM '
        'SELECT_STEP_0 GROUP BY TOTO, FLORIZARRE ORDER BY RAICHU asc) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM TOPN_STEP_1'
    assert query.query_name == 'TOPN_STEP_1'
