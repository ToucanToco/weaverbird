from unittest.mock import Mock

import pytest

from weaverbird.backends.sql_translator.metadata import ColumnMetadata
from weaverbird.backends.sql_translator.steps.rollup import translate_rollup
from weaverbird.pipeline.steps import RollupStep


@pytest.fixture
def sql_query_describer():
    return Mock(return_value={'toto': 'int', 'raichu': 'text'})


def test_translate_rollup(query, sql_query_describer):
    step = RollupStep(
        name='rollup',
        hierarchy=['CONTINENT', 'COUNTRY', 'CITY'],
        aggregations=[
            {'newcolumns': ['VALUE'], 'aggfunction': 'sum', 'columns': ['VALUE']},
        ],
    )
    result = translate_rollup(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        result.transformed_query
        == '''WITH SELECT_STEP_0 AS (SELECT * FROM products), \
ROLLUP_STEP_1 AS (SELECT CONTINENT, COUNTRY, CITY, \
COALESCE(CITY, COUNTRY, CONTINENT) AS LABEL, \
CASE WHEN CITY IS NOT NULL THEN 'CITY' WHEN COUNTRY IS NOT NULL \
THEN 'COUNTRY' WHEN CONTINENT IS NOT NULL THEN 'CONTINENT' ELSE '' END AS LEVEL, \
CASE WHEN LEVEL = 'COUNTRY' THEN "CONTINENT" WHEN LEVEL = 'CITY' \
THEN "COUNTRY" ELSE NULL END AS PARENT, SUM(VALUE) AS VALUE FROM SELECT_STEP_0 \
GROUP BY ROLLUP(CONTINENT, COUNTRY, CITY) HAVING CONTINENT IS NOT NULL)'''
    )
    assert result.query_name == 'ROLLUP_STEP_1'
    assert result.selection_query == 'SELECT TOTO, RAICHU FROM ROLLUP_STEP_1'
    assert result.metadata_manager.retrieve_query_metadata_columns() == {
        'TOTO': ColumnMetadata(
            name='TOTO',
            original_name='toto',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'RAICHU': ColumnMetadata(
            name='RAICHU',
            original_name='raichu',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
    }


def test_translate_rollup_groupby(query, sql_query_describer):
    step = RollupStep(
        name='rollup',
        hierarchy=['CONTINENT', 'COUNTRY', 'CITY'],
        aggregations=[
            {
                'newcolumns': ['VALUE-sum', 'COUNT'],
                'aggfunction': 'sum',
                'columns': ['VALUE', 'COUNT'],
            },
            {'newcolumns': ['VALUE-avg'], 'aggfunction': 'avg', 'columns': ['VALUE']},
        ],
        groupby=['YEAR'],
        labelCol='MY_LABEL',
        levelCol='MY_LEVEL',
        parentLabelCol='MY_PARENT',
    )
    result = translate_rollup(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        result.transformed_query
        == """WITH SELECT_STEP_0 AS (SELECT * FROM products), \
ROLLUP_STEP_1 AS (SELECT CONTINENT, COUNTRY, CITY, YEAR, COALESCE(CITY, COUNTRY, CONTINENT) AS MY_LABEL, \
CASE WHEN CITY IS NOT NULL THEN 'CITY' WHEN COUNTRY IS NOT NULL THEN 'COUNTRY' WHEN CONTINENT IS NOT NULL \
THEN 'CONTINENT' ELSE '' END AS MY_LEVEL, CASE WHEN MY_LEVEL = 'COUNTRY' \
THEN "CONTINENT" WHEN MY_LEVEL = 'CITY' THEN "COUNTRY" ELSE NULL END AS MY_PARENT, SUM(VALUE) AS VALUE-sum, \
SUM(COUNT) AS COUNT, AVG(VALUE) AS VALUE-avg FROM SELECT_STEP_0 \
GROUP BY YEAR, ROLLUP(CONTINENT, COUNTRY, CITY) HAVING CONTINENT IS NOT NULL)"""
    )
    assert result.selection_query == 'SELECT TOTO, RAICHU FROM ROLLUP_STEP_1'
