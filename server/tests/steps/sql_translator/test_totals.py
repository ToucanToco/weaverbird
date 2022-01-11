import pytest

from weaverbird.backends.sql_translator.metadata import ColumnMetadata, SqlQueryMetadataManager
from weaverbird.backends.sql_translator.steps.totals import translate_totals
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.pipeline.steps import TotalsStep


@pytest.fixture()
def query():
    return SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT * FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={
                'table1': {
                    'VALUE_1': 'int',
                    'VALUE_2': 'int',
                    'YEAR': 'int',
                    'COUNTRY': 'text',
                    'PRODUCT': 'text',
                },
            },
        ),
    )


def test_translate_totals(query):
    step = TotalsStep(
        **{
            'name': 'totals',
            'totalDimensions': [
                {'totalColumn': 'COUNTRY', 'totalRowsLabel': 'All countries'},
                {'totalColumn': 'PRODUCT', 'totalRowsLabel': 'All products'},
            ],
            'aggregations': [
                {
                    'columns': ['VALUE_1', 'VALUE_2'],
                    'aggfunction': 'sum',
                    'newcolumns': ['VALUE_1-SUM', 'VALUE_2-SUM'],
                },
                {
                    'columns': ['VALUE_1'],
                    'aggfunction': 'avg',
                    'newcolumns': ['VALUE_1-AVG'],
                },
            ],
            'groups': ['YEAR'],
        }
    )
    new_query = translate_totals(
        step,
        query,
        index=1,
    )
    expected_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), TOTALS_STEP_1 AS ('
        'SELECT CASE WHEN GROUPING(COUNTRY) = 0 THEN COUNTRY ELSE \'All countries\' END AS "COUNTRY", '
        'CASE WHEN GROUPING(PRODUCT) = 0 THEN PRODUCT ELSE \'All products\' END AS "PRODUCT", '
        'SUM(VALUE_1) AS "VALUE_1-SUM", SUM(VALUE_2) AS "VALUE_2-SUM", AVG(VALUE_1) '
        'AS "VALUE_1-AVG", YEAR FROM SELECT_STEP_0 GROUP BY YEAR, '
        'GROUPING SETS((COUNTRY), (PRODUCT), (COUNTRY, PRODUCT), ()))'
    )
    assert new_query.transformed_query == expected_query
    assert new_query.query_name == 'TOTALS_STEP_1'
    assert (
        new_query.selection_query
        == 'SELECT COUNTRY, PRODUCT, VALUE_1-SUM, VALUE_2-SUM, VALUE_1-AVG, YEAR FROM TOTALS_STEP_1'
    )
    assert new_query.metadata_manager.retrieve_query_metadata_columns() == {
        'VALUE_1-SUM': ColumnMetadata(
            name='VALUE_1-SUM',
            original_name='VALUE_1-SUM',
            type='FLOAT',
            original_type='INT',
            alias=None,
            delete=False,
        ),
        'VALUE_2-SUM': ColumnMetadata(
            name='VALUE_2-SUM',
            original_name='VALUE_2-SUM',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'VALUE_1-AVG': ColumnMetadata(
            name='VALUE_1-AVG',
            original_name='VALUE_1-AVG',
            type='FLOAT',
            original_type='FLOAT',
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
        'PRODUCT': ColumnMetadata(
            name='PRODUCT',
            original_name='PRODUCT',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'YEAR': ColumnMetadata(
            name='YEAR',
            original_name='YEAR',
            type='INT',
            original_type='INT',
            alias=None,
            delete=False,
        ),
    }


def test_translate_totals_no_group(query):
    step = TotalsStep(
        **{
            'name': 'totals',
            'totalDimensions': [
                {'totalColumn': 'COUNTRY', 'totalRowsLabel': 'All countries'},
                {'totalColumn': 'PRODUCT', 'totalRowsLabel': 'All products'},
            ],
            'aggregations': [
                {
                    'columns': ['VALUE_1', 'VALUE_2'],
                    'aggfunction': 'sum',
                    'newcolumns': ['VALUE_1-SUM', 'VALUE_2-SUM'],
                },
                {
                    'columns': ['VALUE_1'],
                    'aggfunction': 'avg',
                    'newcolumns': ['VALUE_1-AVG'],
                },
            ],
            'groups': [],
        }
    )
    new_query = translate_totals(
        step,
        query,
        index=1,
    )
    expected_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), TOTALS_STEP_1 AS ('
        'SELECT CASE WHEN GROUPING(COUNTRY) = 0 THEN COUNTRY ELSE \'All countries\' END AS "COUNTRY", '
        'CASE WHEN GROUPING(PRODUCT) = 0 THEN PRODUCT ELSE \'All products\' END AS "PRODUCT", '
        'SUM(VALUE_1) AS "VALUE_1-SUM", SUM(VALUE_2) AS "VALUE_2-SUM", AVG(VALUE_1) '
        'AS "VALUE_1-AVG" FROM SELECT_STEP_0 GROUP BY '
        'GROUPING SETS((COUNTRY), (PRODUCT), (COUNTRY, PRODUCT), ()))'
    )
    assert new_query.transformed_query == expected_query
    assert new_query.query_name == 'TOTALS_STEP_1'
    assert (
        new_query.selection_query
        == 'SELECT COUNTRY, PRODUCT, VALUE_1-SUM, VALUE_2-SUM, VALUE_1-AVG FROM TOTALS_STEP_1'
    )
    assert new_query.metadata_manager.retrieve_query_metadata_columns() == {
        'VALUE_1-SUM': ColumnMetadata(
            name='VALUE_1-SUM',
            original_name='VALUE_1-SUM',
            type='FLOAT',
            original_type='INT',
            alias=None,
            delete=False,
        ),
        'VALUE_2-SUM': ColumnMetadata(
            name='VALUE_2-SUM',
            original_name='VALUE_2-SUM',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'VALUE_1-AVG': ColumnMetadata(
            name='VALUE_1-AVG',
            original_name='VALUE_1-AVG',
            type='FLOAT',
            original_type='FLOAT',
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
        'PRODUCT': ColumnMetadata(
            name='PRODUCT',
            original_name='PRODUCT',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
    }
