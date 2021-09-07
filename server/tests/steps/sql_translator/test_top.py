import pytest

from weaverbird.backends.sql_translator.steps import translate_top
from weaverbird.pipeline.steps import TopStep


def test_translate_top_empty(query):
    step = TopStep(name='top', groups=[], rank_on='RAICHU', sort='asc', limit=3)

    query = translate_top(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), TOP_STEP_1 AS  (SELECT TOTO, RAICHU, FLORIZARRE FROM "
        "SELECT_STEP_0 ORDER BY RAICHU asc LIMIT 3)"
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM TOP_STEP_1'
    assert query.query_name == 'TOP_STEP_1'


def test_translate_top(query):
    step = TopStep(name='top', groups=['TOTO', 'FLORIZARRE'], rank_on='RAICHU', sort='asc', limit=3)

    query = translate_top(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), TOP_STEP_1 AS (SELECT * FROM (SELECT TOTO AS TOTO_ALIAS_0, "
        "FLORIZARRE AS FLORIZARRE_ALIAS_1, RAICHU AS RAICHU_ALIAS_2  FROM SELECT_STEP_0 GROUP BY TOTO_ALIAS_0, "
        "FLORIZARRE_ALIAS_1, RAICHU_ALIAS_2) TOP_STEP_1_ALIAS INNER JOIN SELECT_STEP_0 SELECT_STEP_0_ALIAS ON (("
        "TOTO_ALIAS_0 = SELECT_STEP_0_ALIAS.TOTO) AND (FLORIZARRE_ALIAS_1 = SELECT_STEP_0_ALIAS.FLORIZARRE) AND ("
        "RAICHU_ALIAS_2 = SELECT_STEP_0_ALIAS.RAICHU)) ORDER BY SELECT_STEP_0_ALIAS.RAICHU asc LIMIT 3)"
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM TOP_STEP_1'
    assert query.query_name == 'TOP_STEP_1'


def test_translate_top_error(query):
    step = TopStep(name='top', groups=['TOTO'], rank_on='RAICHU', sort='desc', limit=5)

    query = translate_top(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), TOP_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE FROM '
        'SELECT_STEP_0 GROUP BY TOTO, FLORIZARRE, RAICHU ORDER BY RAICHU desc LIMIT 5)'
    )
    with pytest.raises(AssertionError):
        assert query.transformed_query == expected_transformed_query
