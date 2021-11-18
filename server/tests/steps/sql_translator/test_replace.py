from weaverbird.backends.sql_translator.steps import translate_replace
from weaverbird.pipeline.steps import ReplaceStep


def test_translate_simple_replace(query):
    step = ReplaceStep(name='replace', search_column='RAICHU', to_replace=[["'abc'", "'re'"]])

    query = translate_replace(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), REPLACE_STEP_1 AS (SELECT TOTO, FLORIZARRE, CASE WHEN '
        "RAICHU='abc' THEN 're' ELSE RAICHU END AS RAICHU FROM SELECT_STEP_0)"
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM REPLACE_STEP_1'
    assert query.query_name == 'REPLACE_STEP_1'


def test_translate_string_integer_replace(query):
    step = ReplaceStep(name='replace', search_column='RAICHU', to_replace=[[2, 4]])

    query = translate_replace(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), REPLACE_STEP_1 AS (SELECT TOTO, FLORIZARRE, CASE WHEN '
        'RAICHU=2 THEN 4 ELSE RAICHU END AS RAICHU FROM SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM REPLACE_STEP_1'
    assert query.query_name == 'REPLACE_STEP_1'


def test_translate_multiple_replace(query):
    step = ReplaceStep(
        name='replace', search_column='RAICHU', to_replace=[[2, 4], [456.765, 221.3]]
    )

    query = translate_replace(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), REPLACE_STEP_1 AS (SELECT TOTO, FLORIZARRE, CASE WHEN '
        'RAICHU=2 THEN 4 WHEN RAICHU=456.765 THEN 221.3 ELSE RAICHU END AS RAICHU FROM SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM REPLACE_STEP_1'
    assert query.query_name == 'REPLACE_STEP_1'


def test_translate_with_quotes_and_without_replace(query):
    step = ReplaceStep(
        name='replace',
        search_column='RAICHU',
        to_replace=[["'TEST'", "'OK DOCK"], ["'L'EXEMPLE", 'GOGO"GADJET\'']],
    )

    query = translate_replace(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), REPLACE_STEP_1 AS (SELECT TOTO, FLORIZARRE, CASE WHEN '
        'RAICHU=\'TEST\' THEN \'OK DOCK\' WHEN RAICHU=\'L\\\'EXEMPLE\' THEN \'GOGO\\\'GADJET\' ELSE RAICHU END AS '
        'RAICHU FROM SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM REPLACE_STEP_1'
    assert query.query_name == 'REPLACE_STEP_1'
