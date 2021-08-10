import pytest

from weaverbird.backends.sql_translator.steps import translate_rename
from weaverbird.backends.sql_translator.types import SQLQuery, SqlQueryMetadataManager
from weaverbird.pipeline.steps import RenameStep


@pytest.fixture
def query():
    return SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT toto, raichu, florizarre FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={'table1': {'toto': 'str', 'raichu': 'int', 'florizarre': 'str'}}
        ),
    )


def test_translate_rename(query):
    step = RenameStep(name='rename', to_rename=[['toto', 'toto_name']])
    query = translate_rename(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), RENAME_STEP_1 AS (SELECT toto AS '
        'toto_name FROM SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT raichu, florizarre, toto_name FROM RENAME_STEP_1'
    assert query.query_name == 'RENAME_STEP_1'
