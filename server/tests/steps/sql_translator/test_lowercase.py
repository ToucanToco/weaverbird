from weaverbird.backends.sql_translator.steps import translate_lowercase
from weaverbird.pipeline.steps import UppercaseStep


def test_translate_simple_lowercase(query):
    step = UppercaseStep(name='uppercase', column='raichu')

    query = translate_lowercase(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), LOWERCASE_STEP_1 AS (SELECT TOTO, FLORIZARRE, LOWER(raichu) '
        'AS RAICHU FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM LOWERCASE_STEP_1'
    assert query.query_name == 'LOWERCASE_STEP_1'
