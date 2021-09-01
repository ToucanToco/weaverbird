from unittest.mock import Mock

import pandas as pd
import pytest

from weaverbird.backends.sql_translator.metadata import ColumnMetadata, SqlQueryMetadataManager
from weaverbird.backends.sql_translator.steps import translate_pivot
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.pipeline.steps import PivotStep


@pytest.fixture
def sql_query_executor():
    def f(domain, query_string, run):
        return Mock(df=pd.DataFrame({'CURRENCY': ['SPAIN', 'FRANCE']}))

    return f


def test_translate_pivot(sql_query_executor):
    query = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT COMPANY, COUNTRY, CURRENCY, PROVIDER FROM PRODUCTS)',
        selection_query='SELECT COMPANY, COUNTRY, CURRENCY, PROVIDER FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={
                'PRODUCTS': {
                    'COMPANY': 'str',
                    'COUNTRY': 'str',
                    'CURRENCY': 'str',
                    'PROVIDER': 'str',
                }
            },
        ),
    )
    step = PivotStep(
        name='pivot',
        index=['COMPANY', 'COUNTRY'],
        column_to_pivot='CURRENCY',
        value_column='PROVIDER',
        agg_function='sum',
    )
    res = translate_pivot(step, query, index=1, sql_query_executor=sql_query_executor)
    assert (
        res.transformed_query
        == """WITH SELECT_STEP_0 AS (SELECT COMPANY, COUNTRY, CURRENCY, PROVIDER FROM PRODUCTS),\
 PIVOT_STEP_1 AS (SELECT COMPANY, COUNTRY, "'SPAIN'" AS SPAIN, "'FRANCE'" AS FRANCE\
 FROM SELECT_STEP_0 PIVOT(sum(PROVIDER) FOR CURRENCY IN ('SPAIN', 'FRANCE')))"""
    )
    assert res.selection_query == 'SELECT COMPANY, COUNTRY, SPAIN, FRANCE FROM PIVOT_STEP_1'
    assert res.metadata_manager.retrieve_query_metadata_columns() == {
        'COMPANY': ColumnMetadata(
            name='COMPANY',
            original_name='COMPANY',
            type='STR',
            original_type='STR',
            alias=None,
            delete=False,
        ),
        'COUNTRY': ColumnMetadata(
            name='COUNTRY',
            original_name='COUNTRY',
            type='STR',
            original_type='STR',
            alias=None,
            delete=False,
        ),
        '''"'SPAIN'"''': ColumnMetadata(
            name='"\'SPAIN\'"',
            original_name='"\'SPAIN\'"',
            type='STR',
            original_type='STR',
            alias='SPAIN',
            delete=False,
        ),
        '''"'FRANCE'"''': ColumnMetadata(
            name='"\'FRANCE\'"',
            original_name='"\'FRANCE\'"',
            type='STR',
            original_type='STR',
            alias='FRANCE',
            delete=False,
        ),
    }


def test_translate_pivot_error(sql_query_executor, mocker):
    step = PivotStep(
        name='pivot',
        index=['COMPANY', 'COUNTRY'],
        column_to_pivot='CURRENCY',
        value_column='PROVIDER',
        agg_function='sum',
    )
    query = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT COMPANY, COUNTRY, CURRENCY, PROVIDER FROM PRODUCTS)',
        selection_query='SELECT COMPANY, COUNTRY, CURRENCY, PROVIDER FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={
                'PRODUCTS': {
                    'COMPANY': 'str',
                    'COUNTRY': 'str',
                    'CURRENCY': 'str',
                    'PROVIDER': 'str',
                }
            },
        ),
    )
    mocker.patch(
        'weaverbird.backends.sql_translator.steps.pivot.build_selection_query',
        side_effect=Exception,
    )
    with pytest.raises(Exception):
        translate_pivot(step, query, index=1)
