from weaverbird.backends.sql_translator.steps import translate_delete
from weaverbird.pipeline.steps import DeleteStep


def test_translate_select(query):
    step = DeleteStep(name='delete', columns=['RAICHU'])
    query = translate_delete(
        step,
        query,
        index=1,
    )
    assert (
        query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), DELETE_STEP_1 AS (SELECT TOTO, FLORIZARRE FROM '
        'SELECT_STEP_0)'
    )
    assert query.selection_query == 'SELECT TOTO, FLORIZARRE FROM DELETE_STEP_1'
    assert query.query_name == 'DELETE_STEP_1'


def test_translate_select_invalid_column(query, mocker):
    """
    It should not fail if a column does not exist
    """
    step = DeleteStep(name='delete', columns=['RAICHU', 'BIDULE'])

    query = translate_delete(
        step,
        query,
        index=1,
    )
    assert 'BIDULE' not in query.selection_query
    assert 'RAICHU' not in query.selection_query
