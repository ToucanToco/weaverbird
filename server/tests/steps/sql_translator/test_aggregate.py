from unittest.mock import Mock

import pytest

from weaverbird.backends.sql_translator.metadata import SqlQueryMetadataManager
from weaverbird.backends.sql_translator.steps import translate_aggregate
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.exceptions import DuplicateColumnError
from weaverbird.pipeline.steps import AggregateStep
from weaverbird.pipeline.steps.aggregate import Aggregation


@pytest.fixture
def query():
    return SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT * FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={
                'table1': {
                    'Value1': 'int',
                    'Value2': 'int',
                    'Label': 'str',
                    'title': 'str',
                    'Group': 'str',
                },
            },
        ),
    )


@pytest.fixture
def sql_query_describer():
    return Mock(return_value={'toto': 'int', 'raichu': 'str'})


def test_translate_aggregate(query, sql_query_describer):

    step = AggregateStep(
        name='aggregate',
        aggregations=[
            Aggregation(
                aggfunction='sum',
                columns=['Value1', 'Value2'],
                newcolumns=['Sum_Value1', 'Sum_Value2'],
            ),
            Aggregation(aggfunction='avg', columns=['Value1'], newcolumns=['Avg_Value1']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT SUM(Value1) AS Sum_Value1, SUM(Value2) AS Sum_Value2, AVG(Value1) AS Avg_Value1 FROM SELECT_STEP_0)'
    )


def test_translate_aggregate_with_group_by(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        on=['category'],
        aggregations=[
            Aggregation(
                aggfunction='sum',
                columns=['Value1', 'Value2'],
                newcolumns=['Sum_Value1', 'Sum_Value2'],
            ),
            Aggregation(aggfunction='avg', columns=['Value1'], newcolumns=['Avg_Value1']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT SUM(Value1) AS Sum_Value1, SUM(Value2) AS Sum_Value2, AVG(Value1) AS Avg_Value1, category FROM SELECT_STEP_0 GROUP BY category)'
    )


def test_count(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        on=['category'],
        aggregations=[
            Aggregation(aggfunction='count', columns=['Label'], newcolumns=['count']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT COUNT(Label) AS count, category FROM SELECT_STEP_0 GROUP BY category)'
    )


def test_first_no_aggregation_with_groupby(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        on=['category'],
        aggregations=[
            Aggregation(aggfunction='first', columns=['Label'], newcolumns=['first_Label']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT first_Label, category FROM (SELECT Label AS first_Label, category, ROW_NUMBER() OVER (PARTITION BY category ORDER BY Label) AS R FROM SELECT_STEP_0 QUALIFY R = 1))'
    )


def test_first_no_group_by_no_aggregation(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        aggregations=[
            Aggregation(aggfunction='first', columns=['Label'], newcolumns=['first_Label']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT first_Label FROM (SELECT Label AS first_Label, ROW_NUMBER() OVER (ORDER BY Label) AS R FROM SELECT_STEP_0 QUALIFY R = 1))'
    )


def test_last_no_group_by_no_aggregation_no_first(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        aggregations=[
            Aggregation(aggfunction='last', columns=['Label'], newcolumns=['last_Label']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT last_Label FROM (SELECT Label AS last_Label, ROW_NUMBER() OVER (ORDER BY Label DESC) AS R FROM SELECT_STEP_0 QUALIFY R = 1))'
    )


def test_last_with_group_by_no_aggregation_no_first(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        on=['category'],
        aggregations=[
            Aggregation(aggfunction='last', columns=['Label'], newcolumns=['last_Label']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT last_Label, category FROM (SELECT Label AS last_Label, category, ROW_NUMBER() OVER (PARTITION BY category ORDER BY Label DESC) AS R FROM SELECT_STEP_0 QUALIFY R = 1))'
    )


def test_last_with_group_by_no_aggregation_with_first(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        on=['category'],
        aggregations=[
            Aggregation(aggfunction='first', columns=['Label'], newcolumns=['first_label']),
            Aggregation(aggfunction='last', columns=['title'], newcolumns=['last_title']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT first_label, last_title, category FROM (SELECT Label AS first_label, title AS last_title, category, ROW_NUMBER() OVER (PARTITION BY category ORDER BY Label, title DESC) AS R FROM SELECT_STEP_0 QUALIFY R = 1))'
    )


def test_last_no_group_by_with_aggregation_with_first(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        aggregations=[
            Aggregation(aggfunction='first', columns=['Label'], newcolumns=['first_label']),
            Aggregation(aggfunction='sum', columns=['title'], newcolumns=['sum_title']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT A.*, F.first_label FROM (SELECT SUM(title) AS sum_title FROM SELECT_STEP_0) A INNER JOIN (SELECT first_label FROM (SELECT Label AS first_label, ROW_NUMBER() OVER (ORDER BY Label) AS R FROM SELECT_STEP_0 QUALIFY R = 1)) F)'
    )


def test_last_no_group_by_with_aggregation_with_last(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        aggregations=[
            Aggregation(aggfunction='last', columns=['Label'], newcolumns=['last_label']),
            Aggregation(aggfunction='sum', columns=['title'], newcolumns=['sum_title']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT A.*, F.last_label FROM (SELECT SUM(title) AS sum_title FROM SELECT_STEP_0) A INNER JOIN (SELECT last_label FROM (SELECT Label AS last_label, ROW_NUMBER() OVER (ORDER BY Label DESC) AS R FROM SELECT_STEP_0 QUALIFY R = 1)) F)'
    )


def test_last_no_group_by_with_aggregation_with_last_with_first(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        aggregations=[
            Aggregation(aggfunction='last', columns=['Label'], newcolumns=['last_label']),
            Aggregation(aggfunction='first', columns=['title'], newcolumns=['first_title']),
            Aggregation(aggfunction='sum', columns=['title'], newcolumns=['sum_title']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT A.*, F.first_title, F.last_label FROM (SELECT SUM(title) AS sum_title FROM SELECT_STEP_0) A INNER JOIN (SELECT first_title, last_label FROM (SELECT title AS first_title, Label AS last_label, ROW_NUMBER() OVER (ORDER BY title, Label DESC) AS R FROM SELECT_STEP_0 QUALIFY R = 1)) F)'
    )


def test_with_group_by_with_aggregation_with_last_with_first(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        on=['category'],
        aggregations=[
            Aggregation(aggfunction='last', columns=['Label'], newcolumns=['last_label']),
            Aggregation(aggfunction='first', columns=['title'], newcolumns=['first_title']),
            Aggregation(aggfunction='sum', columns=['title'], newcolumns=['sum_title']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT A.*, F.first_title, F.last_label FROM (SELECT SUM(title) AS sum_title, category FROM SELECT_STEP_0 GROUP BY category) A INNER JOIN (SELECT first_title, last_label, category FROM (SELECT title AS first_title, Label AS last_label, category, ROW_NUMBER() OVER (PARTITION BY category ORDER BY title, Label DESC) AS R FROM SELECT_STEP_0 QUALIFY R = 1)) F ON A.category=F.category)'
    )


def test_count_distinct(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        on=[],
        aggregations=[
            Aggregation(
                aggfunction='count distinct',
                columns=['Group'],
                newcolumns=['Group_CD'],
            )
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT COUNT(DISTINCT Group) AS Group_CD FROM SELECT_STEP_0)'
    )


def test_count_distinct_whitespace_replace(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        on=[],
        aggregations=[
            Aggregation(
                aggfunction='count distinct',
                columns=['Group'],
                newcolumns=['Group CD'],
            )
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT COUNT(DISTINCT Group) AS Group_CD FROM SELECT_STEP_0)'
    )


def test_duplicate_aggregation_columns(query, sql_query_describer):

    with pytest.raises(DuplicateColumnError):
        step = AggregateStep(
            name='aggregate',
            on=['Group'],
            aggregations=[
                Aggregation(
                    aggfunction='count distinct including empty',
                    columns=['Group', 'Group'],
                    newcolumns=['coucou'],
                ),
            ],
        )
        translate_aggregate(step, query, index=1)
