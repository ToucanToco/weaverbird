import pytest

from weaverbird.backends.sql_translator.steps import translate_sort
from weaverbird.backends.sql_translator.types import SQLQuery, SqlQueryMetadataManager
from weaverbird.pipeline.steps import SortStep
from weaverbird.pipeline.steps.sort import ColumnSort


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


def test_translate_sort(query):
    step = SortStep(
        name='sort',
        columns=[
            ColumnSort(column='toto', order='asc'),
            ColumnSort(column='raichu', order='desc'),
        ],
    )
    query = translate_sort(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), SORT_STEP_1 AS (SELECT toto, raichu, florizarre FROM '
        'SELECT_STEP_0 ORDER BY toto asc, raichu desc) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre FROM SORT_STEP_1'
    assert query.query_name == 'SORT_STEP_1'
