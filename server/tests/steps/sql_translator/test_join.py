from unittest.mock import Mock

import pytest

from weaverbird.backends.sql_translator.steps import translate_join
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SqlQueryMetadataManager,
)
from weaverbird.pipeline.steps import JoinStep


@pytest.fixture
def mock_translate_pipeline() -> SQLPipelineTranslator:
    return lambda p, _, __: ('SELECT * FROM ORDERS', _, __)


@pytest.fixture
def sql_query_retriever():
    return Mock(return_value='SELECT * FROM ORDERS')


@pytest.fixture
def sql_query_describer():
    return Mock(return_value={'CUSTOMER_ID': 'int', 'CUSTOMER_NAME': 'str'})


@pytest.fixture
def query():
    return SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM CUSTOMERS)',
        selection_query='SELECT ID, NAME FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={'CUSTOMERS': {'ID': 'int', 'NAME': 'str'}},
            query_metadata={'ID': 'int', 'NAME': 'str'},
        ),
    )


def test_join(
    query,
    sql_query_describer,
    sql_query_retriever,
    mock_translate_pipeline,
):
    step = JoinStep(
        name='join',
        right_pipeline=[{'name': 'domain', 'domain': 'buzz'}],
        on=[
            ['ID', 'CUSTOMER_ID'],
        ],
        type='left',
    )
    query_result = translate_join(
        step=step,
        query=query,
        index=1,
        sql_query_retriever=sql_query_retriever,
        sql_query_describer=sql_query_describer,
        sql_translate_pipeline=mock_translate_pipeline,
    )

    expected_result = '''WITH SELECT_STEP_0 AS (SELECT * FROM CUSTOMERS), JOIN_STEP_1_RIGHT AS (SELECT * FROM ORDERS), JOIN_STEP_1 AS (SELECT SELECT_STEP_0.ID AS ID_LEFT, SELECT_STEP_0.NAME AS NAME_LEFT, JOIN_STEP_1_RIGHT.CUSTOMER_ID AS CUSTOMER_ID_RIGHT, JOIN_STEP_1_RIGHT.CUSTOMER_NAME AS CUSTOMER_NAME_RIGHT FROM SELECT_STEP_0 LEFT JOIN JOIN_STEP_1_RIGHT ON SELECT_STEP_0.ID = JOIN_STEP_1_RIGHT.CUSTOMER_ID)'''

    assert query_result.transformed_query == expected_result
    assert (
        query_result.selection_query
        == '''SELECT ID_LEFT, NAME_LEFT, CUSTOMER_ID_RIGHT, CUSTOMER_NAME_RIGHT FROM JOIN_STEP_1'''
    )


def test_join_error(
    query, sql_query_describer, sql_query_retriever, mock_translate_pipeline, mocker
):
    step = JoinStep(
        name='join',
        right_pipeline=[{'name': 'domain', 'domain': 'buzz'}],
        on=[
            ['ID', 'CUSTOMER_ID'],
        ],
        type='left',
    )
    mocker.patch(
        'weaverbird.backends.sql_translator.steps.join.resolve_sql_pipeline_for_combination',
        side_effect=Exception,
    )
    with pytest.raises(Exception):
        translate_join(
            step=step,
            query=query,
            index=1,
            sql_query_retriever=sql_query_retriever,
            sql_query_describer=sql_query_describer,
            sql_translate_pipeline=mock_translate_pipeline,
        )
