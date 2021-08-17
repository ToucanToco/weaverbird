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
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), RENAME_STEP_1 AS (SELECT raichu, florizarre, toto AS '
        'toto_name FROM SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT raichu, florizarre, toto_name FROM RENAME_STEP_1'
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
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), RENAME_STEP_2 AS (SELECT florizarre, toto AS toto_name, '
        'raichu AS raichu_renamed FROM SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query == 'SELECT florizarre, toto_name, raichu_renamed FROM RENAME_STEP_2'
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
            tables_metadata={'table2': {'toto': 'str', 'raichu': 'int', 'florizarre': 'str'}}
        ),
    )

    with pytest.raises(AssertionError):
        assert translate_rename(step, mocker, index=1) == translate_rename(step, query, index=1)
