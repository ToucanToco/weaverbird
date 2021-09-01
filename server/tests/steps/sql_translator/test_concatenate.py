from weaverbird.backends.sql_translator.steps import translate_concatenate
from weaverbird.pipeline.steps import ConcatenateStep


def test_translate_simple_concatenante(query):
    step = ConcatenateStep(
        name='concatenate', columns=['TOTO', 'AGE'], separator=',', new_column_name='TO_AGE'
    )

    query = translate_concatenate(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), CONCATENATE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, "
        "TO_AGE, CONCAT_WS(',', TOTO, AGE) AS TO_AGE FROM SELECT_STEP_0)"
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, TO_AGE FROM CONCATENATE_STEP_1'
    )
    assert query.query_name == 'CONCATENATE_STEP_1'
