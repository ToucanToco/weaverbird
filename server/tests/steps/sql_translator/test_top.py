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
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), TOP_STEP_1 AS (SELECT RAICHU FROM SELECT_STEP_0  '
        'ORDER BY RAICHU asc LIMIT 3) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT RAICHU FROM TOP_STEP_1'
    assert query.query_name == 'TOP_STEP_1'


def test_translate_top(query):
    step = TopStep(name='top', groups=['TOTO', 'FLORIZARRE'], rank_on='RAICHU', sort='asc', limit=3)

    query = translate_top(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), TOP_STEP_1 AS (SELECT RAICHU, TOTO, FLORIZARRE FROM '
        'SELECT_STEP_0 GROUP BY TOTO, FLORIZARRE, RAICHU ORDER BY RAICHU asc LIMIT 3) '
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
        'SELECT_STEP_0 GROUP BY TOTO, FLORIZARRE, RAICHU ORDER BY RAICHU desc LIMIT 5) '
    )
    with pytest.raises(AssertionError):
        assert query.transformed_query == expected_transformed_query
