import datetime

import pytest

from weaverbird.backends.sql_translator.metadata import SqlQueryMetadataManager
from weaverbird.backends.sql_translator.steps import translate_filter
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.pipeline.conditions import ComparisonCondition
from weaverbird.pipeline.steps import FilterStep


def test_translate_filter(mocker):
    step = FilterStep(
        name='filter', condition=ComparisonCondition(column='amount', operator='eq', value=10)
    )
    query = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT TOTO, TATA FROM products)',
        selection_query='SELECT TOTO, TATA FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={'table1': {'toto': 'text', 'tata': 'int'}},
        ),
    )
    mocker.patch(
        'weaverbird.backends.sql_translator.steps.utils.query_transformation.apply_condition',
        return_value='SELECT TOTO, TATA FROM SELECT_STEP_0 WHERE amount = 10',
    )
    res = translate_filter(step, query, index=1)
    assert (
        res.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT TOTO, TATA FROM products), FILTER_STEP_1 AS (SELECT TOTO, TATA FROM '
        'SELECT_STEP_0 WHERE amount = 10)'
    )
    assert res.selection_query == 'SELECT TOTO, TATA FROM FILTER_STEP_1'


def test_translate_filter_date():
    step = FilterStep(
        name='filter',
        condition=ComparisonCondition(
            column='CREATED',
            operator='gt',
            value=datetime.datetime.strptime('2020-01-01 01:03:30', '%Y-%m-%d %H:%M:%S'),
        ),
    )
    query = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT TOTO, TATA FROM products)',
        selection_query='SELECT TOTO, TATA FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={'table1': {'toto': 'text', 'created': 'date'}},
        ),
    )
    res = translate_filter(step, query, index=1)
    assert (
        res.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT TOTO, TATA FROM products), FILTER_STEP_1 AS (SELECT TOTO, CREATED FROM '
        'SELECT_STEP_0 WHERE to_timestamp(CREATED) > to_timestamp(\'2020-01-01T01:03:30\'))'
    )
    assert res.selection_query == 'SELECT TOTO, CREATED FROM FILTER_STEP_1'


def test_translate_filter_error(mocker):
    step = FilterStep(
        name='filter', condition=ComparisonCondition(column='amount', operator='eq', value=10)
    )
    query = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products), SELECT * FROM SELECT_STEP_0',
        selection_query='SELECT * FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={'table1': {'toto': 'text', 'tata': 'int'}},
        ),
    )
    mocker.patch(
        'weaverbird.backends.sql_translator.steps.filter.apply_condition',
        side_effect=NotImplementedError,
    )
    with pytest.raises(NotImplementedError):
        translate_filter(step, query, index=1)
