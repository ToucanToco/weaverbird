import pytest

from weaverbird.backends.sql_translator.steps import translate_lowercase
from weaverbird.backends.sql_translator.types import SQLQuery, SqlQueryMetadataManager
from weaverbird.pipeline.steps import UppercaseStep


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


def test_translate_simple_lowercase(query):
    step = UppercaseStep(name='uppercase', column='raichu')

    query = translate_lowercase(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), LOWERCASE_STEP_1 AS (SELECT TOTO, FLORIZARRE, LOWER(raichu) '
        'AS RAICHU FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre FROM LOWERCASE_STEP_1'
    assert query.query_name == 'LOWERCASE_STEP_1'
