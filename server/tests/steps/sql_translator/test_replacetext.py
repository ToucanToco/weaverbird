from weaverbird.backends.sql_translator.steps.replacetext import translate_replacetext
from weaverbird.pipeline.steps.replacetext import ReplaceTextStep


def test_translate_simple_replacetext(query):
    step = ReplaceTextStep(
        name="replacetext", search_column="RAICHU", old_str="'abc'", new_str="'re'"
    )

    query = translate_replacetext(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), REPLACE_STEP_1 AS (SELECT TOTO, FLORIZARRE, CASE WHEN "
        "RAICHU='abc' THEN 're' ELSE RAICHU END AS RAICHU FROM SELECT_STEP_0)"
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == "SELECT TOTO, RAICHU, FLORIZARRE FROM REPLACE_STEP_1"
    assert query.query_name == "REPLACE_STEP_1"


def test_translate_with_quotes_mixed_replacetext(query):
    step = ReplaceTextStep(
        name="replacetext",
        search_column="RAICHU",
        old_str="'L'EXEMPLE",
        new_str="GOGO\"GADJET'",
    )

    query = translate_replacetext(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), REPLACE_STEP_1 AS (SELECT TOTO, FLORIZARRE, CASE WHEN "
        "RAICHU='TEST' THEN 'OK DOCK' WHEN RAICHU='L\\'EXEMPLE' THEN 'GOGO\\'GADJET' ELSE RAICHU END AS "
        "RAICHU FROM SELECT_STEP_0)"
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == "SELECT TOTO, RAICHU, FLORIZARRE FROM REPLACE_STEP_1"
    assert query.query_name == "REPLACE_STEP_1"
