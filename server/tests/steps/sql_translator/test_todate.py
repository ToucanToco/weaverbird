from weaverbird.backends.sql_translator.steps import translate_todate
from weaverbird.pipeline.steps import ToDateStep


def test_translate_simple_todate(query):
    step = ToDateStep(name='todate', column='RAICHU', format='%d/%m/%Y')

    query = translate_todate(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), TODATE_STEP_1 AS (SELECT TOTO, FLORIZARRE, IFF(TRY_TO_DATE('
<<<<<<< HEAD
        "RAICHU) != NULL, TO_DATE(RAICHU, '%d/%m/%Y') , 'not-valid-date-format') AS RAICHU ) FROM SELECT_STEP_0) "
=======
        'RAICHU, \'%d/%m/%Y\') != NULL, TO_DATE(RAICHU, \'%d/%m/%Y\'), \'not-valid-date-format\') AS RAICHU) FROM '
        'SELECT_STEP_0) '
>>>>>>> feat(vqb): security check on date format
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM TODATE_STEP_1'
    assert query.query_name == 'TODATE_STEP_1'


def test_translate_automatic_guess_todate(query):
    step = ToDateStep(name='todate', column='RAICHU')

    query = translate_todate(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), TODATE_STEP_1 AS (SELECT TOTO, FLORIZARRE, IFF(TRY_TO_DATE('
<<<<<<< HEAD
        "RAICHU) != NULL, TO_DATE(RAICHU) , 'not-valid-date-format') AS RAICHU ) FROM SELECT_STEP_0) "
=======
        'RAICHU) != NULL, TO_DATE(RAICHU), \'not-valid-date-format\') AS RAICHU) FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM TODATE_STEP_1'
    assert query.query_name == 'TODATE_STEP_1'


def test_translate_hard_todate(query):
    step = ToDateStep(name='todate', column='RAICHU', format="mm/dd/yyyy, 'hh24:mi hours'")

    query = translate_todate(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), TODATE_STEP_1 AS (SELECT TOTO, FLORIZARRE, IFF(TRY_TO_DATE('
        'RAICHU, \'mm/dd/yyyy, hh24:mi hours\') != NULL, TO_DATE(RAICHU, \'mm/dd/yyyy, hh24:mi hours\'), '
        '\'not-valid-date-format\') AS RAICHU) FROM SELECT_STEP_0) '
>>>>>>> feat(vqb): security check on date format
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM TODATE_STEP_1'
    assert query.query_name == 'TODATE_STEP_1'
