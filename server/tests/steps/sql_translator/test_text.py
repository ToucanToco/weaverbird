from weaverbird.backends.sql_translator.steps.text import translate_text
from weaverbird.backends.sql_translator.types import SQLQuery, SqlQueryMetadataManager
from weaverbird.pipeline.steps import TextStep


def test_text(query):
    step = TextStep(name='text', new_column='BEST_SINGER_EVER', text='jean-jacques-goldman')
    query_result = translate_text(step, query, index=1)

    expected_transformed_query = (
        """WITH SELECT_STEP_0 AS (SELECT * FROM products), TEXT_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, """
        """'jean-jacques-goldman' AS BEST_SINGER_EVER FROM """
        """SELECT_STEP_0) """
    )
    assert query_result.transformed_query == expected_transformed_query
    assert (
        query_result.selection_query
        == """SELECT TOTO, RAICHU, FLORIZARRE, BEST_SINGER_EVER FROM TEXT_STEP_1"""
    )
    assert query_result.query_name == 'TEXT_STEP_1'


def test_text_only_one():
    step = TextStep(name='text', new_column='BEST_SINGER_EVER', text='jean-jacques-goldman')
    q = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT RAICHU FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(tables_metadata={'table1': {}}, query_metadata={}),
    )
    query_result = translate_text(step, q, index=1)

    expected_transformed_query = (
        """WITH SELECT_STEP_0 AS (SELECT * FROM products), TEXT_STEP_1 AS (SELECT """
        """'jean-jacques-goldman' AS BEST_SINGER_EVER FROM """
        """SELECT_STEP_0) """
    )
    assert query_result.transformed_query == expected_transformed_query
    assert query_result.selection_query == """SELECT BEST_SINGER_EVER FROM TEXT_STEP_1"""
    assert query_result.query_name == 'TEXT_STEP_1'
