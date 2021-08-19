from weaverbird.backends.sql_translator.steps import translate_fromdate
from weaverbird.pipeline.steps import FromdateStep


def test_translate_simple_fromdate(query):
    step = FromdateStep(name='fromdate', column='RAICHU', format='%d/%m/%Y')

    query = translate_fromdate(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), FROMDATE_STEP_1 AS (SELECT TOTO, FLORIZARRE, TO_VARCHAR('
        'RAICHU, \'%d/%m/%Y\') AS RAICHU) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM FROMDATE_STEP_1'
    assert query.query_name == 'FROMDATE_STEP_1'


def test_translate_hard_fromdate(query):
    step = FromdateStep(name='fromdate', column='RAICHU', format="mm/dd/yyyy, 'hh24:mi hours'")

    query = translate_fromdate(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), FROMDATE_STEP_1 AS (SELECT TOTO, FLORIZARRE, TO_VARCHAR('
        'RAICHU, \'mm/dd/yyyy, hh24:mi hours\') AS RAICHU) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM FROMDATE_STEP_1'
    assert query.query_name == 'FROMDATE_STEP_1'
