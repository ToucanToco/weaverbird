from unittest.mock import Mock

import pytest

from weaverbird.backends.sql_translator.metadata import ColumnMetadata, TableMetadata
from weaverbird.backends.sql_translator.steps import translate_customsql
from weaverbird.pipeline.steps import CustomSqlStep


@pytest.fixture
def sql_query_describer():
    return Mock(return_value={'CUSTOMER_ID': 'int', 'CUSTOMER_NAME': 'text'})


def test_translate_customsql(query, sql_query_describer):
    step = CustomSqlStep(name='customsql', query='SELECT * FROM ##PREVIOUS_STEP##')
    query = translate_customsql(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), CUSTOMSQL_STEP_1 AS (SELECT * FROM '
        'SELECT_STEP_0)'
    )
    assert query.selection_query == 'SELECT CUSTOMER_ID, CUSTOMER_NAME FROM CUSTOMSQL_STEP_1'
    assert query.query_name == 'CUSTOMSQL_STEP_1'
    assert query.metadata_manager.retrieve_query_metadata() == TableMetadata(
        name='TABLE1',
        original_name='TABLE1',
        delete=False,
        columns={
            'CUSTOMER_ID': ColumnMetadata(
                name='CUSTOMER_ID',
                original_name='CUSTOMER_ID',
                type='INT',
                original_type='int',
                alias=None,
                delete=False,
            ),
            'CUSTOMER_NAME': ColumnMetadata(
                name='CUSTOMER_NAME',
                original_name='CUSTOMER_NAME',
                type='TEXT',
                original_type='text',
                alias=None,
                delete=False,
            ),
        },
    )


def test_translate_custom_error(query):
    step = CustomSqlStep(name='customsql', query='SELECT * FROM ##PREVIOUS_STEP##')

    def f():
        raise Exception

    with pytest.raises(Exception):
        translate_customsql(step, query, index=1, sql_query_describer=f)
