import pytest

from weaverbird.backends.sql_translator.steps import translate_rename
from weaverbird.backends.sql_translator.types import SQLQuery, SqlQueryMetadataManager
from weaverbird.pipeline.steps import RenameStep


def test_translate_simple_rename(query):
    step = RenameStep(name='rename', to_rename=[['toto', 'toto_name']])
    query = translate_rename(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), RENAME_STEP_1 AS (SELECT RAICHU, FLORIZARRE, '
        'toto AS TOTO_NAME FROM SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT raichu, florizarre, TOTO_NAME FROM RENAME_STEP_1'
    assert query.query_name == 'RENAME_STEP_1'


def test_translate_simple_rename_only_one():
    q = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT toto FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={'table1': {'toto': 'int'}},
            query_metadata={'toto': 'int'},
        ),
    )
    step = RenameStep(name='rename', to_rename=[['toto', 'toto_name']])
    query = translate_rename(
        step,
        q,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), RENAME_STEP_1 AS (SELECT toto AS TOTO_NAME FROM '
        'SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO_NAME FROM RENAME_STEP_1'
    assert query.query_name == 'RENAME_STEP_1'


def test_translate_multiple_rename(query):
    step = RenameStep(
        name='rename', to_rename=[['toto', 'toto_name'], ['raichu', 'raichu_renamed']]
    )
    query = translate_rename(
        step,
        query,
        index=2,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), RENAME_STEP_2 AS (SELECT FLORIZARRE, toto AS TOTO_NAME, '
        'raichu AS RAICHU_RENAMED FROM SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query == 'SELECT florizarre, TOTO_NAME, RAICHU_RENAMED FROM RENAME_STEP_2'
    )
    assert query.query_name == 'RENAME_STEP_2'


def test_translate_rename_error(query):
    step = RenameStep(
        name='rename', to_rename=[['toto', 'toto_name'], ['raichu', 'raichu_renamed']]
    )
    mocker = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT toto, raichu, florizarre FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={'table2': {'toto': 'str', 'raichu': 'int', 'florizarre': 'str'}},
            query_metadata={'toto': 'str', 'raichu': 'int', 'florizarre': 'str'},
        ),
    )

    with pytest.raises(AssertionError):
        assert translate_rename(step, mocker, index=1) == translate_rename(step, query, index=1)
