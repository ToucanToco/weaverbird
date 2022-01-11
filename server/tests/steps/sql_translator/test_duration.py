import pytest

from weaverbird.backends.sql_translator.metadata import ColumnMetadata, SqlQueryMetadataManager
from weaverbird.backends.sql_translator.steps import translate_duration
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.pipeline.steps import DurationStep


@pytest.fixture
def query_date_duration():
    return SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT TOTO, RAICHU, FLORIZARRE FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={
                'TABLE1': {
                    'TOTO': 'text',
                    'RAICHU': 'int',
                    'FLORIZARRE': 'text',
                    'FROM_DATE': 'date',
                    'TO_DATE': 'date',
                }
            },
        ),
    )


def test_translate_simple_duration(query_date_duration):
    step = DurationStep(
        name='duration',
        newColumnName='DURATION',
        startDateColumn='FROM_DATE',
        endDateColumn='TO_DATE',
        durationIn='days',
    )
    query = translate_duration(
        step,
        query_date_duration,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), DURATION_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        'FROM_DATE, TO_DATE, DATEDIFF(days, to_timestamp(FROM_DATE), to_timestamp(TO_DATE)) AS DURATION FROM '
        'SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query
        == 'SELECT TOTO, RAICHU, FLORIZARRE, FROM_DATE, TO_DATE, DURATION FROM DURATION_STEP_1'
    )
    assert query.query_name == 'DURATION_STEP_1'
    # we test metadatas
    assert query.metadata_manager.retrieve_query_metadata_columns() == {
        'DURATION': ColumnMetadata(
            name='DURATION',
            original_name='DURATION',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'FLORIZARRE': ColumnMetadata(
            name='FLORIZARRE',
            original_name='FLORIZARRE',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'FROM_DATE': ColumnMetadata(
            name='FROM_DATE',
            original_name='FROM_DATE',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
        'RAICHU': ColumnMetadata(
            name='RAICHU',
            original_name='RAICHU',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'TOTO': ColumnMetadata(
            name='TOTO',
            original_name='TOTO',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'TO_DATE': ColumnMetadata(
            name='TO_DATE',
            original_name='TO_DATE',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
    }


def test_translate_with_old_column_name_duration(query_date_duration):
    step = DurationStep(
        name='duration',
        newColumnName='TOTO',
        startDateColumn='FROM_DATE',
        endDateColumn='TO_DATE',
        durationIn='days',
    )
    query = translate_duration(
        step,
        query_date_duration,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), DURATION_STEP_1 AS (SELECT RAICHU, FLORIZARRE, FROM_DATE, '
        'TO_DATE, DATEDIFF(days, to_timestamp(FROM_DATE), to_timestamp(TO_DATE)) AS TOTO FROM SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query
        == 'SELECT TOTO, RAICHU, FLORIZARRE, FROM_DATE, TO_DATE FROM DURATION_STEP_1'
    )
    assert query.query_name == 'DURATION_STEP_1'
    # we test metadatas
    assert query.metadata_manager.retrieve_query_metadata_columns() == {
        'FLORIZARRE': ColumnMetadata(
            name='FLORIZARRE',
            original_name='FLORIZARRE',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'FROM_DATE': ColumnMetadata(
            name='FROM_DATE',
            original_name='FROM_DATE',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
        'RAICHU': ColumnMetadata(
            name='RAICHU',
            original_name='RAICHU',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'TOTO': ColumnMetadata(
            name='TOTO',
            original_name='TOTO',
            type='FLOAT',
            original_type='FLOAT',
            alias=None,
            delete=False,
        ),
        'TO_DATE': ColumnMetadata(
            name='TO_DATE',
            original_name='TO_DATE',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
    }
