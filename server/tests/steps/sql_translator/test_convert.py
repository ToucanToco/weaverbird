import pytest

from weaverbird.backends.sql_translator.steps import translate_convert
from weaverbird.backends.sql_translator.types import SQLQuery, SqlQueryMetadataManager
from weaverbird.pipeline.steps import ConvertStep


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


def test_translate_cast(query):
    step = ConvertStep(
        name='convert',
        columns=['raichu'],
        data_type='integer'
    )
    query = translate_convert(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), CONVERT_STEP_1 AS (SELECT raichu, florizarre, toto AS '
        'toto_name FROM SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT raichu, florizarre, toto_name FROM CONVERT_STEP_1'
    assert query.query_name == 'CONVERT_STEP_1'

