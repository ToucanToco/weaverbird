import pytest

from weaverbird.backends.sql_translator.steps import translate_uniquegroups
from weaverbird.pipeline.steps import UniqueGroupsStep


def test_translate_uniquegroups_empty(query):
    step = UniqueGroupsStep(name='uniquegroups', on=[])

    query = translate_uniquegroups(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), UNIQUEGROUPS_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE FROM '
        'SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM UNIQUEGROUPS_STEP_1'
    assert query.query_name == 'UNIQUEGROUPS_STEP_1'


def test_translate_uniquegroups(query):
    step = UniqueGroupsStep(name='uniquegroups', on=['TOTO', 'FLORIZARRE'])

    query = translate_uniquegroups(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), UNIQUEGROUPS_STEP_1 AS (SELECT TOTO, FLORIZARRE FROM '
        'SELECT_STEP_0 GROUP BY TOTO, FLORIZARRE)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, FLORIZARRE FROM UNIQUEGROUPS_STEP_1'
    assert query.query_name == 'UNIQUEGROUPS_STEP_1'


def test_translate_uniquegroups_error(query):
    step = UniqueGroupsStep(name='uniquegroups', on=['TOTO'])

    query = translate_uniquegroups(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), UNIQUEGROUPS_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE FROM '
        'SELECT_STEP_0 GROUP BY TOTO, FLORIZARRE)'
    )
    with pytest.raises(AssertionError):
        assert query.transformed_query == expected_transformed_query
