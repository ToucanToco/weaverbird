from unittest.mock import Mock

import pytest

from weaverbird.backends.sql_translator.metadata import ColumnMetadata, SqlQueryMetadataManager
from weaverbird.backends.sql_translator.steps import translate_append
from weaverbird.backends.sql_translator.types import SQLPipelineTranslator, SQLQuery
from weaverbird.pipeline.steps import AppendStep


@pytest.fixture
def mock_translate_pipeline() -> SQLPipelineTranslator:
    return lambda p, _, __: ('SELECT * FROM CUSTOMERS_2', _, __)


@pytest.fixture
def sql_query_retriever():
    return Mock(return_value='SELECT * FROM CUSTOMERS_2')


@pytest.fixture
def sql_query_describer():
    return Mock(return_value={'ID': 'int', 'NAME': 'text', 'COUNTRY': 'text'})


@pytest.fixture
def query():
    return SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM CUSTOMERS_1)',
        selection_query='SELECT ID, NAME FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={'CUSTOMERS_1': {'ID': 'int', 'NAME': 'text'}},
            query_metadata={'ID': 'int', 'NAME': 'text'},
        ),
    )


def test_append(
    query,
    sql_query_describer,
    sql_query_retriever,
    mock_translate_pipeline,
):
    step = AppendStep(name='append', pipelines=['CUSTOMERS_2'])
    query_result = translate_append(
        step=step,
        query=query,
        index=1,
        sql_query_retriever=sql_query_retriever,
        sql_query_describer=sql_query_describer,
        sql_translate_pipeline=mock_translate_pipeline,
    )
    expected_transformed = 'WITH SELECT_STEP_0 AS (SELECT * FROM CUSTOMERS_1),\
 APPEND_STEP_UNION_0 AS (SELECT * FROM CUSTOMERS_2), APPEND_STEP_1 AS\
 (SELECT ID, NAME, NULL AS COUNTRY FROM SELECT_STEP_0 UNION ALL SELECT ID, NAME, COUNTRY FROM APPEND_STEP_UNION_0)'
    expect_selection = 'SELECT ID, NAME, COUNTRY FROM APPEND_STEP_1'
    assert query_result.transformed_query == expected_transformed
    assert query_result.selection_query == expect_selection
    assert query_result.metadata_manager.retrieve_query_metadata_columns_as_list() == [
        'ID',
        'NAME',
        'COUNTRY',
    ]
    assert query_result.metadata_manager.retrieve_query_metadata_columns() == {
        'COUNTRY': ColumnMetadata(
            name='COUNTRY',
            original_name='NULL AS COUNTRY',
            type='UNDEFINED',
            original_type='UNDEFINED',
            alias=None,
            delete=False,
        ),
        'ID': ColumnMetadata(
            name='ID', original_name='ID', type='INT', original_type='int', alias=None, delete=False
        ),
        'NAME': ColumnMetadata(
            name='NAME',
            original_name='NAME',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
    }


def test_append_error(
    query, sql_query_describer, sql_query_retriever, mock_translate_pipeline, mocker
):
    step = AppendStep(name='append', pipelines=['CUSTOMERS_2'])
    mocker.patch(
        'weaverbird.backends.sql_translator.steps.append.resolve_sql_pipeline_for_combination',
        side_effect=Exception,
    )
    with pytest.raises(Exception):
        translate_append(
            step=step,
            query=query,
            index=1,
            sql_query_retriever=sql_query_retriever,
            sql_query_describer=sql_query_describer,
            sql_translate_pipeline=mock_translate_pipeline,
        )
