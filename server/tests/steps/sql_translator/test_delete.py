import pytest

from weaverbird.backends.sql_translator.metadata import MetadataError
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


def test_translate_select_error(query, mocker):
    step = DeleteStep(name='delete', columns=['RAICHU', 'BIDULE'])

    with pytest.raises(MetadataError):
        translate_delete(
            step,
            query,
            index=1,
        )
