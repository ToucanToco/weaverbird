import pytest

from weaverbird.backends.sql_translator.steps import translate_select
from weaverbird.backends.sql_translator.types import SQLQuery, SqlQueryMetadataManager
from weaverbird.pipeline.steps import SelectStep


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


def test_translate_select(query):
    step = SelectStep(name='select', columns=['raichu', 'florizarre'])
    query = translate_select(
        step,
        query,
        index=1,
    )
    assert (
        query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), KEEPCOLS_STEP_1 AS (SELECT raichu, florizarre FROM SELECT_STEP_0)'
    )
    assert query.selection_query == 'SELECT raichu, florizarre FROM KEEPCOLS_STEP_1'
    assert query.query_name == 'KEEPCOLS_STEP_1'
