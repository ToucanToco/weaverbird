import pytest

from weaverbird.backends.sql_translator.metadata import ColumnMetadata, SqlQueryMetadataManager
from weaverbird.backends.sql_translator.steps import translate_unpivot
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.pipeline.steps import UnpivotStep


def test_translate_unpivot(mocker):
    step = UnpivotStep(
        name='unpivot',
        keep=['COMPANY', 'COUNTRY'],
        unpivot=['CURRENCY', 'PROVIDER'],
        unpivot_column_name='KPI',
        value_column_name='VALUE',
        dropna=True,
    )
    query = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT COMPANY, COUNTRY, CURRENCY, PROVIDER FROM PRODUCTS)',
        selection_query='SELECT COMPANY, COUNTRY, CURRENCY, PROVIDER FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={
                'PRODUCTS': {
                    'COMPANY': 'text',
                    'COUNTRY': 'text',
                    'CURRENCY': 'text',
                    'PROVIDER': 'text',
                }
            },
        ),
    )
    res = translate_unpivot(step, query, index=1)
    assert (
        res.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT COMPANY, COUNTRY, CURRENCY, PROVIDER FROM PRODUCTS), UNPIVOT_STEP_1 AS (SELECT COMPANY, COUNTRY, KPI, VALUE FROM SELECT_STEP_0 UNPIVOT(VALUE FOR KPI IN (CURRENCY, PROVIDER)))'
    )
    assert res.selection_query == 'SELECT COMPANY, COUNTRY, KPI, VALUE FROM UNPIVOT_STEP_1'
    assert res.metadata_manager.retrieve_query_metadata_columns() == {
        'COMPANY': ColumnMetadata(
            name='COMPANY',
            original_name='COMPANY',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'COUNTRY': ColumnMetadata(
            name='COUNTRY',
            original_name='COUNTRY',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'KPI': ColumnMetadata(
            name='KPI',
            original_name='KPI',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'VALUE': ColumnMetadata(
            name='VALUE',
            original_name='VALUE',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
    }


def test_translate_unpivot_error(mocker):
    step = UnpivotStep(
        name='unpivot',
        keep=['COMPANY', 'COUNTRY'],
        unpivot=['CURRENCY', 'PROVIDER'],
        unpivot_column_name='KPI',
        value_column_name='VALUE',
        dropna=True,
    )
    query = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT COMPANY, COUNTRY, CURRENCY, PROVIDER FROM PRODUCTS)',
        selection_query='SELECT COMPANY, COUNTRY, CURRENCY, PROVIDER FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={
                'PRODUCTS': {
                    'COMPANY': 'text',
                    'COUNTRY': 'text',
                    'CURRENCY': 'text',
                    'PROVIDER': 'text',
                }
            },
        ),
    )
    mocker.patch(
        'weaverbird.backends.sql_translator.steps.unpivot.build_selection_query',
        side_effect=Exception,
    )
    with pytest.raises(Exception):
        translate_unpivot(step, query, index=1)
