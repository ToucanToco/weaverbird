from weaverbird.backends.sql_translator.steps import translate_uppercase
from weaverbird.pipeline.steps import UppercaseStep


def test_translate_simple_uppercase(query):
    step = UppercaseStep(name='uppercase', column='raichu')

    query = translate_uppercase(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), UPPERCASE_STEP_1 AS (SELECT TOTO, FLORIZARRE, UPPER(raichu) '
        'AS RAICHU FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre FROM UPPERCASE_STEP_1'
    assert query.query_name == 'UPPERCASE_STEP_1'
