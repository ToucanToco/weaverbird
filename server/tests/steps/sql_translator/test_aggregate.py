from unittest.mock import Mock

import pytest

from weaverbird.backends.sql_translator.metadata import ColumnMetadata, SqlQueryMetadataManager
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
                    'Label': 'text',
                    'title': 'text',
                    'Group': 'text',
                },
            },
        ),
    )


@pytest.fixture
def sql_query_describer():
    return Mock(return_value={'toto': 'int', 'raichu': 'text'})


def test_translate_aggregate(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        aggregations=[
            Aggregation(
                aggfunction='sum',
                columns=['VALUE1', 'VALUE2'],
                newcolumns=['SUM_VALUE1', 'SUM_VALUE2'],
            ),
            Aggregation(aggfunction='avg', columns=['VALUE1'], newcolumns=['AVG_VALUE1']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT SUM(VALUE1) AS SUM_VALUE1, '
        'SUM(VALUE2) AS SUM_VALUE2, AVG(VALUE1) AS AVG_VALUE1 FROM SELECT_STEP_0)'
    )
    # metadatas
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'AVG_VALUE1': ColumnMetadata(
            name='AVG_VALUE1',
            original_name='AVG_VALUE1',
            type='FLOAT',
            original_type='float',
            alias=None,
            delete=False,
        ),
        'SUM_VALUE1': ColumnMetadata(
            name='SUM_VALUE1',
            original_name='SUM_VALUE1',
            type='FLOAT',
            original_type='float',
            alias=None,
            delete=False,
        ),
        'SUM_VALUE2': ColumnMetadata(
            name='SUM_VALUE2',
            original_name='SUM_VALUE2',
            type='FLOAT',
            original_type='float',
            alias=None,
            delete=False,
        ),
    }


def test_translate_aggregate_keep_granularity(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        aggregations=[
            Aggregation(
                aggfunction='sum',
                columns=['VALUE1', 'VALUE2'],
                newcolumns=['SUM_VALUE1', 'SUM_VALUE2'],
            ),
            Aggregation(aggfunction='avg', columns=['VALUE1'], newcolumns=['AVG_VALUE1']),
        ],
        keep_original_granularity=True,
    )

    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)

    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT SUM(VALUE1) AS SUM_VALUE1, '
        'SUM(VALUE2) AS SUM_VALUE2, AVG(VALUE1) AS AVG_VALUE1 FROM SELECT_STEP_0)'
    )
    # metadatas
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'AVG_VALUE1': ColumnMetadata(
            name='AVG_VALUE1',
            original_name='AVG_VALUE1',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'GROUP': ColumnMetadata(
            name='GROUP',
            original_name='Group',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'LABEL': ColumnMetadata(
            name='LABEL',
            original_name='Label',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'SUM_VALUE1': ColumnMetadata(
            name='SUM_VALUE1',
            original_name='SUM_VALUE1',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'SUM_VALUE2': ColumnMetadata(
            name='SUM_VALUE2',
            original_name='SUM_VALUE2',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'TITLE': ColumnMetadata(
            name='TITLE',
            original_name='title',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'VALUE1': ColumnMetadata(
            name='VALUE1',
            original_name='Value1',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'VALUE2': ColumnMetadata(
            name='VALUE2',
            original_name='Value2',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
    }


def test_translate_aggregate_with_group_by(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        on=['CATEGORY'],
        aggregations=[
            Aggregation(
                aggfunction='sum',
                columns=['VALUE1', 'VALUE2'],
                newcolumns=['SUM_VALUE1', 'SUM_VALUE2'],
            ),
            Aggregation(aggfunction='avg', columns=['VALUE1'], newcolumns=['AVG_VALUE1']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT * FROM (SELECT CATEGORY, '
        'SUM(VALUE1) AS SUM_VALUE1, SUM(VALUE2) AS SUM_VALUE2, AVG(VALUE1) AS AVG_VALUE1 FROM SELECT_STEP_0 GROUP '
        'BY CATEGORY ORDER BY CATEGORY) SELECT_STEP_0_ALIAS)'
    )
    # metadatas
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'AVG_VALUE1': ColumnMetadata(
            name='AVG_VALUE1',
            original_name='AVG_VALUE1',
            type='FLOAT',
            original_type='float',
            alias=None,
            delete=False,
        ),
        'SUM_VALUE1': ColumnMetadata(
            name='SUM_VALUE1',
            original_name='SUM_VALUE1',
            type='FLOAT',
            original_type='float',
            alias=None,
            delete=False,
        ),
        'SUM_VALUE2': ColumnMetadata(
            name='SUM_VALUE2',
            original_name='SUM_VALUE2',
            type='FLOAT',
            original_type='float',
            alias=None,
            delete=False,
        ),
        'CATEGORY': ColumnMetadata(
            name='CATEGORY',
            original_name='CATEGORY',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
    }


def test_translate_aggregate_with_group_by_keep_granularity(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        on=['CATEGORY'],
        aggregations=[
            Aggregation(
                aggfunction='sum',
                columns=['VALUE1', 'VALUE2'],
                newcolumns=['SUM_VALUE1', 'SUM_VALUE2'],
            ),
            Aggregation(aggfunction='avg', columns=['VALUE1'], newcolumns=['AVG_VALUE1']),
        ],
        keep_original_granularity=True,
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT * FROM (SELECT CATEGORY AS '
        'CATEGORY_ALIAS_0, SUM(VALUE1) AS SUM_VALUE1, SUM(VALUE2) AS SUM_VALUE2, AVG(VALUE1) AS AVG_VALUE1 FROM '
        'SELECT_STEP_0 GROUP BY CATEGORY_ALIAS_0) AGGREGATE_STEP_1_ALIAS INNER JOIN (SELECT *, ROW_NUMBER() OVER ('
        'ORDER BY (SELECT NULL)) AS TO_REMOVE_AGGREGATE_STEP_1 FROM SELECT_STEP_0) SELECT_STEP_0_ALIAS ON (('
        'CATEGORY_ALIAS_0 = SELECT_STEP_0_ALIAS.CATEGORY)) ORDER BY TO_REMOVE_AGGREGATE_STEP_1)'
    )
    # metadatas
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'AVG_VALUE1': ColumnMetadata(
            name='AVG_VALUE1',
            original_name='AVG_VALUE1',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'CATEGORY': ColumnMetadata(
            name='CATEGORY',
            original_name='CATEGORY',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'GROUP': ColumnMetadata(
            name='GROUP',
            original_name='Group',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'LABEL': ColumnMetadata(
            name='LABEL',
            original_name='Label',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'SUM_VALUE1': ColumnMetadata(
            name='SUM_VALUE1',
            original_name='SUM_VALUE1',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'SUM_VALUE2': ColumnMetadata(
            name='SUM_VALUE2',
            original_name='SUM_VALUE2',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'TITLE': ColumnMetadata(
            name='TITLE',
            original_name='title',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'VALUE1': ColumnMetadata(
            name='VALUE1',
            original_name='Value1',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'VALUE2': ColumnMetadata(
            name='VALUE2',
            original_name='Value2',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
    }


def test_count(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        on=['category'],
        aggregations=[
            Aggregation(aggfunction='count', columns=['Label'], newcolumns=['Label_count']),
        ],
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT * FROM (SELECT category, '
        'COUNT(Label) AS Label_count FROM SELECT_STEP_0 GROUP BY category ORDER BY category) SELECT_STEP_0_ALIAS)'
    )
    # metadatas
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'CATEGORY': ColumnMetadata(
            name='CATEGORY',
            original_name='category',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'LABEL_COUNT': ColumnMetadata(
            name='LABEL_COUNT',
            original_name='Label_count',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
    }


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
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT first_Label, category FROM ('
        'SELECT *,Label AS first_Label, ROW_NUMBER() OVER (PARTITION BY category ORDER BY Label) AS R FROM '
        'SELECT_STEP_0 QUALIFY R = 1))'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'CATEGORY': ColumnMetadata(
            name='CATEGORY',
            original_name='category',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'FIRST_LABEL': ColumnMetadata(
            name='FIRST_LABEL',
            original_name='first_Label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
    }


def test_first_no_aggregation_with_groupby_keep_granularity(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        on=['category'],
        aggregations=[
            Aggregation(aggfunction='first', columns=['Label'], newcolumns=['first_Label']),
        ],
        keep_original_granularity=True,
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT * FROM (SELECT category AS '
        'X_category,Label AS first_Label, ROW_NUMBER() OVER (PARTITION BY category ORDER BY Label) AS R FROM '
        'SELECT_STEP_0 QUALIFY R = 1) X INNER JOIN (SELECT *,ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS '
        'TO_REMOVE_SELECT_STEP_0_ALIAS FROM SELECT_STEP_0) Z ON X.X_category=Z.category ORDER BY '
        'TO_REMOVE_SELECT_STEP_0_ALIAS)'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'CATEGORY': ColumnMetadata(
            name='CATEGORY',
            original_name='category',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'FIRST_LABEL': ColumnMetadata(
            name='FIRST_LABEL',
            original_name='first_Label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'GROUP': ColumnMetadata(
            name='GROUP',
            original_name='Group',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'LABEL': ColumnMetadata(
            name='LABEL',
            original_name='Label',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'TITLE': ColumnMetadata(
            name='TITLE',
            original_name='title',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'VALUE1': ColumnMetadata(
            name='VALUE1',
            original_name='Value1',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'VALUE2': ColumnMetadata(
            name='VALUE2',
            original_name='Value2',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
    }


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
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT first_Label FROM (SELECT *,'
        'Label AS first_Label, ROW_NUMBER() OVER (ORDER BY Label) AS R FROM SELECT_STEP_0 QUALIFY R = 1))'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'FIRST_LABEL': ColumnMetadata(
            name='FIRST_LABEL',
            original_name='first_Label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        )
    }


def test_first_no_group_by_no_aggregation_keep_granularity(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        aggregations=[
            Aggregation(aggfunction='first', columns=['Label'], newcolumns=['first_Label']),
        ],
        keep_original_granularity=True,
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT * FROM (SELECT Label AS '
        'first_Label, ROW_NUMBER()OVER (ORDER BY Label) AS R FROM SELECT_STEP_0 QUALIFY R = 1) X INNER JOIN '
        'SELECT_STEP_0 Z )'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'FIRST_LABEL': ColumnMetadata(
            name='FIRST_LABEL',
            original_name='first_Label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'GROUP': ColumnMetadata(
            name='GROUP',
            original_name='Group',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'LABEL': ColumnMetadata(
            name='LABEL',
            original_name='Label',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'TITLE': ColumnMetadata(
            name='TITLE',
            original_name='title',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'VALUE1': ColumnMetadata(
            name='VALUE1',
            original_name='Value1',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'VALUE2': ColumnMetadata(
            name='VALUE2',
            original_name='Value2',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
    }


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
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT last_Label FROM (SELECT *,'
        'Label AS last_Label, ROW_NUMBER() OVER (ORDER BY Label) AS R FROM SELECT_STEP_0 QUALIFY R = 1))'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'LAST_LABEL': ColumnMetadata(
            name='LAST_LABEL',
            original_name='last_Label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        )
    }


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
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT last_Label, category FROM ('
        'SELECT *,Label AS last_Label, ROW_NUMBER() OVER (PARTITION BY category ORDER BY Label) AS R FROM '
        'SELECT_STEP_0 QUALIFY R = 1))'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'CATEGORY': ColumnMetadata(
            name='CATEGORY',
            original_name='category',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'LAST_LABEL': ColumnMetadata(
            name='LAST_LABEL',
            original_name='last_Label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
    }


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
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT first_label, last_title, '
        'category FROM (SELECT *,Label AS first_label, title AS last_title, ROW_NUMBER() OVER (PARTITION BY '
        'category ORDER BY Label, title) AS R FROM SELECT_STEP_0 QUALIFY R = 1))'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'CATEGORY': ColumnMetadata(
            name='CATEGORY',
            original_name='category',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'FIRST_LABEL': ColumnMetadata(
            name='FIRST_LABEL',
            original_name='first_label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'LAST_TITLE': ColumnMetadata(
            name='LAST_TITLE',
            original_name='last_title',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
    }


def test_last_with_group_by_no_aggregation_with_first_keep_granularity(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        on=['category'],
        aggregations=[
            Aggregation(aggfunction='first', columns=['Label'], newcolumns=['first_label']),
            Aggregation(aggfunction='last', columns=['title'], newcolumns=['last_title']),
        ],
        keep_original_granularity=True,
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT * FROM (SELECT category AS '
        'X_category,Label AS first_label, title AS last_title, ROW_NUMBER() OVER (PARTITION BY category ORDER BY '
        'Label, title) AS R FROM SELECT_STEP_0 QUALIFY R = 1) X INNER JOIN (SELECT *,ROW_NUMBER() OVER (ORDER BY ('
        'SELECT NULL)) AS TO_REMOVE_SELECT_STEP_0_ALIAS FROM SELECT_STEP_0) Z ON X.X_category=Z.category ORDER BY '
        'TO_REMOVE_SELECT_STEP_0_ALIAS)'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'CATEGORY': ColumnMetadata(
            name='CATEGORY',
            original_name='category',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'FIRST_LABEL': ColumnMetadata(
            name='FIRST_LABEL',
            original_name='first_label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'GROUP': ColumnMetadata(
            name='GROUP',
            original_name='Group',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'LABEL': ColumnMetadata(
            name='LABEL',
            original_name='Label',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'LAST_TITLE': ColumnMetadata(
            name='LAST_TITLE',
            original_name='last_title',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'TITLE': ColumnMetadata(
            name='TITLE',
            original_name='title',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'VALUE1': ColumnMetadata(
            name='VALUE1',
            original_name='Value1',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'VALUE2': ColumnMetadata(
            name='VALUE2',
            original_name='Value2',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
    }


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
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT A.*, F.first_label FROM ('
        'SELECT SUM(title) AS sum_title FROM SELECT_STEP_0) A INNER JOIN (SELECT first_label, sum_title FROM ('
        'SELECT *,Label AS first_label, title AS sum_title, ROW_NUMBER() OVER (ORDER BY Label, title) AS R FROM '
        'SELECT_STEP_0 QUALIFY R = 1)) F)'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'FIRST_LABEL': ColumnMetadata(
            name='FIRST_LABEL',
            original_name='first_label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'SUM_TITLE': ColumnMetadata(
            name='SUM_TITLE',
            original_name='sum_title',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
    }


def test_last_no_group_by_with_aggregation_with_first_keep_granularity(query, sql_query_describer):
    step = AggregateStep(
        name='aggregate',
        aggregations=[
            Aggregation(aggfunction='first', columns=['Label'], newcolumns=['first_label']),
            Aggregation(aggfunction='sum', columns=['title'], newcolumns=['sum_title']),
        ],
        keep_original_granularity=True,
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT A.*, F.first_label FROM ('
        'SELECT SUM(title) AS sum_title FROM SELECT_STEP_0) A INNER JOIN (SELECT * FROM (SELECT Label AS '
        'first_label, title AS sum_title, ROW_NUMBER()OVER (ORDER BY Label, title) AS R FROM SELECT_STEP_0 QUALIFY '
        'R = 1) X INNER JOIN SELECT_STEP_0 Z ) F ON (A.TO_REMOVE_AGGREGATE_STEP_1 = '
        'F.TO_REMOVE_SELECT_STEP_0_ALIAS))'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'FIRST_LABEL': ColumnMetadata(
            name='FIRST_LABEL',
            original_name='first_label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'GROUP': ColumnMetadata(
            name='GROUP',
            original_name='Group',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'LABEL': ColumnMetadata(
            name='LABEL',
            original_name='Label',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'SUM_TITLE': ColumnMetadata(
            name='SUM_TITLE',
            original_name='sum_title',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'TITLE': ColumnMetadata(
            name='TITLE',
            original_name='title',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'VALUE1': ColumnMetadata(
            name='VALUE1',
            original_name='Value1',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'VALUE2': ColumnMetadata(
            name='VALUE2',
            original_name='Value2',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
    }


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
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT A.*, F.last_label FROM ('
        'SELECT SUM(title) AS sum_title FROM SELECT_STEP_0) A INNER JOIN (SELECT last_label, sum_title FROM ('
        'SELECT *,Label AS last_label, title AS sum_title, ROW_NUMBER() OVER (ORDER BY Label, title) AS R FROM '
        'SELECT_STEP_0 QUALIFY R = 1)) F)'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'LAST_LABEL': ColumnMetadata(
            name='LAST_LABEL',
            original_name='last_label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'SUM_TITLE': ColumnMetadata(
            name='SUM_TITLE',
            original_name='sum_title',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
    }


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
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT A.*, F.first_title, '
        'F.last_label FROM (SELECT SUM(title) AS sum_title FROM SELECT_STEP_0) A INNER JOIN (SELECT last_label, '
        'first_title, sum_title FROM (SELECT *,Label AS last_label, title AS first_title, title AS sum_title, '
        'ROW_NUMBER() OVER (ORDER BY Label, title, title) AS R FROM SELECT_STEP_0 QUALIFY R = 1)) F)'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'FIRST_TITLE': ColumnMetadata(
            name='FIRST_TITLE',
            original_name='first_title',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'LAST_LABEL': ColumnMetadata(
            name='LAST_LABEL',
            original_name='last_label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'SUM_TITLE': ColumnMetadata(
            name='SUM_TITLE',
            original_name='sum_title',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
    }


def test_last_no_group_by_with_aggregation_with_last_with_first_keep_granularity(
    query, sql_query_describer
):
    step = AggregateStep(
        name='aggregate',
        aggregations=[
            Aggregation(aggfunction='last', columns=['Label'], newcolumns=['last_label']),
            Aggregation(aggfunction='first', columns=['title'], newcolumns=['first_title']),
            Aggregation(aggfunction='sum', columns=['title'], newcolumns=['sum_title']),
        ],
        keep_original_granularity=True,
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT A.*, F.first_title, '
        'F.last_label FROM (SELECT SUM(title) AS sum_title FROM SELECT_STEP_0) A INNER JOIN (SELECT * FROM (SELECT '
        'Label AS last_label, title AS first_title, title AS sum_title, ROW_NUMBER()OVER (ORDER BY Label, title, '
        'title) AS R FROM SELECT_STEP_0 QUALIFY R = 1) X INNER JOIN SELECT_STEP_0 Z ) F ON ('
        'A.TO_REMOVE_AGGREGATE_STEP_1 = F.TO_REMOVE_SELECT_STEP_0_ALIAS))'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'FIRST_TITLE': ColumnMetadata(
            name='FIRST_TITLE',
            original_name='first_title',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'GROUP': ColumnMetadata(
            name='GROUP',
            original_name='Group',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'LABEL': ColumnMetadata(
            name='LABEL',
            original_name='Label',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'LAST_LABEL': ColumnMetadata(
            name='LAST_LABEL',
            original_name='last_label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'SUM_TITLE': ColumnMetadata(
            name='SUM_TITLE',
            original_name='sum_title',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'TITLE': ColumnMetadata(
            name='TITLE',
            original_name='title',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'VALUE1': ColumnMetadata(
            name='VALUE1',
            original_name='Value1',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'VALUE2': ColumnMetadata(
            name='VALUE2',
            original_name='Value2',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
    }


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
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT A.*, F.first_title, '
        'F.last_label FROM (SELECT * FROM (SELECT category, SUM(title) AS sum_title FROM SELECT_STEP_0 GROUP BY '
        'category ORDER BY category) SELECT_STEP_0_ALIAS) A INNER JOIN (SELECT last_label, first_title, sum_title, '
        'category FROM (SELECT *,Label AS last_label, title AS first_title, title AS sum_title, ROW_NUMBER() OVER '
        '(PARTITION BY category ORDER BY Label, title, title) AS R FROM SELECT_STEP_0 QUALIFY R = 1)) F ON '
        'A.category=F.category)'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'CATEGORY': ColumnMetadata(
            name='CATEGORY',
            original_name='category',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'FIRST_TITLE': ColumnMetadata(
            name='FIRST_TITLE',
            original_name='first_title',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'LAST_LABEL': ColumnMetadata(
            name='LAST_LABEL',
            original_name='last_label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'SUM_TITLE': ColumnMetadata(
            name='SUM_TITLE',
            original_name='sum_title',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
    }


def test_with_group_by_with_aggregation_with_last_with_first_keep_granularity(
    query, sql_query_describer
):
    step = AggregateStep(
        name='aggregate',
        on=['category'],
        aggregations=[
            Aggregation(aggfunction='last', columns=['Label'], newcolumns=['last_label']),
            Aggregation(aggfunction='first', columns=['title'], newcolumns=['first_title']),
            Aggregation(aggfunction='sum', columns=['title'], newcolumns=['sum_title']),
        ],
        keep_original_granularity=True,
    )
    sql_query = translate_aggregate(step, query, index=1, sql_query_describer=sql_query_describer)
    assert (
        sql_query.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT A.*, F.first_title, '
        'F.last_label FROM (SELECT * FROM (SELECT category AS category_ALIAS_0, SUM(title) AS sum_title FROM '
        'SELECT_STEP_0 GROUP BY category_ALIAS_0) AGGREGATE_STEP_1_ALIAS INNER JOIN (SELECT *, ROW_NUMBER() OVER ('
        'ORDER BY (SELECT NULL)) AS TO_REMOVE_AGGREGATE_STEP_1 FROM SELECT_STEP_0) SELECT_STEP_0_ALIAS ON (('
        'category_ALIAS_0 = SELECT_STEP_0_ALIAS.category)) ORDER BY TO_REMOVE_AGGREGATE_STEP_1) A INNER JOIN ('
        'SELECT * FROM (SELECT category AS X_category,Label AS last_label, title AS first_title, '
        'title AS sum_title, ROW_NUMBER() OVER (PARTITION BY category ORDER BY Label, title, title) AS R FROM '
        'SELECT_STEP_0 QUALIFY R = 1) X INNER JOIN (SELECT *,ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS '
        'TO_REMOVE_SELECT_STEP_0_ALIAS FROM SELECT_STEP_0) Z ON X.X_category=Z.category ORDER BY '
        'TO_REMOVE_SELECT_STEP_0_ALIAS) F ON A.category=F.category AND (A.TO_REMOVE_AGGREGATE_STEP_1 = '
        'F.TO_REMOVE_SELECT_STEP_0_ALIAS))'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'CATEGORY': ColumnMetadata(
            name='CATEGORY',
            original_name='category',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'FIRST_TITLE': ColumnMetadata(
            name='FIRST_TITLE',
            original_name='first_title',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'GROUP': ColumnMetadata(
            name='GROUP',
            original_name='Group',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'LABEL': ColumnMetadata(
            name='LABEL',
            original_name='Label',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'LAST_LABEL': ColumnMetadata(
            name='LAST_LABEL',
            original_name='last_label',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'SUM_TITLE': ColumnMetadata(
            name='SUM_TITLE',
            original_name='sum_title',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'TITLE': ColumnMetadata(
            name='TITLE',
            original_name='title',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'VALUE1': ColumnMetadata(
            name='VALUE1',
            original_name='Value1',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'VALUE2': ColumnMetadata(
            name='VALUE2',
            original_name='Value2',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
    }


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
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT COUNT(DISTINCT Group) AS '
        'Group_CD FROM SELECT_STEP_0)'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'GROUP_CD': ColumnMetadata(
            name='GROUP_CD',
            original_name='Group_CD',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        )
    }


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
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), AGGREGATE_STEP_1 AS (SELECT COUNT(DISTINCT Group) AS '
        'Group_CD FROM SELECT_STEP_0)'
    )
    assert sql_query.metadata_manager.retrieve_query_metadata_columns() == {
        'GROUP_CD': ColumnMetadata(
            name='GROUP_CD',
            original_name='Group_CD',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        )
    }


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
