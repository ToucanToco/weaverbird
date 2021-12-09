import pytest

from weaverbird.backends.sql_translator.metadata import ColumnMetadata, SqlQueryMetadataManager
from weaverbird.backends.sql_translator.steps import translate_dateextract
from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    get_query_for_date_extract,
)
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.pipeline.steps import DateExtractStep


@pytest.fixture
def query_date():
    return SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT TOTO, RAICHU, FLORIZARRE FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={
                'TABLE1': {'TOTO': 'text', 'RAICHU': 'int', 'FLORIZARRE': 'text', 'DATE': 'date'}
            },
        ),
    )


def test_translate_simple_date_extract(query_date):
    step = DateExtractStep(name='dateextract', column='DATE', date_info=['year'])

    query = translate_dateextract(
        step,
        query_date,
        index=1,
    )
    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), DATEEXTRACT_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, "
        "DATE, EXTRACT(year from to_timestamp(DATE)) AS DATE_YEAR FROM SELECT_STEP_0)"
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query
        == 'SELECT TOTO, RAICHU, FLORIZARRE, DATE, DATE_YEAR FROM DATEEXTRACT_STEP_1'
    )
    assert query.query_name == 'DATEEXTRACT_STEP_1'

    # assert on metadatas
    assert query.metadata_manager.retrieve_query_metadata_columns() == {
        'DATE': ColumnMetadata(
            name='DATE',
            original_name='DATE',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
        'DATE_YEAR': ColumnMetadata(
            name='DATE_YEAR',
            original_name='DATE_YEAR',
            type='DATE',
            original_type='date',
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
    }


def test_translate_complex_date_extract(query_date):
    step = DateExtractStep(
        name='dateextract',
        column='DATE',
        date_info=[
            'year',
            'previousDay',
            'firstDayOfPreviousYear',
            'firstDayOfPreviousMonth',
            'firstDayOfPreviousWeek',
            'dayOfYear',
            'isoYear',
            'isoWeek',
            'isoDayOfWeek',
            'day',
            'week',
        ],
    )

    query = translate_dateextract(
        step,
        query_date,
        index=1,
    )
    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), "
        "DATEEXTRACT_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, DATE, EXTRACT(year from to_timestamp(DATE)) AS DATE_YEAR, "
        "(DATE_TRUNC(day, to_timestamp(DATE) - interval '1 day')) AS DATE_PREVIOUSDAY, "
        "(TO_TIMESTAMP_NTZ(DATE_TRUNC(year, to_timestamp(DATE))) - interval '1 year') AS DATE_FIRSTDAYOFPREVIOUSYEAR, "
        "(TO_TIMESTAMP_NTZ(DATE_TRUNC(month, to_timestamp(DATE))) - interval '1 month') AS DATE_FIRSTDAYOFPREVIOUSMONTH, "
        "(DATE_TRUNC(day, DATEADD(day, -(DAYOFWEEKISO(to_timestamp(DATE)) % 7 + 1)+1, to_timestamp(DATE))) - interval '1 week') AS DATE_FIRSTDAYOFPREVIOUSWEEK, "
        "EXTRACT(dayofyear from to_timestamp(DATE)) AS DATE_DAYOFYEAR, "
        "(YEAROFWEEKISO(to_timestamp(DATE))) AS DATE_ISOYEAR, "
        "(WEEKISO(to_timestamp(DATE))) AS DATE_ISOWEEK, "
        "(DAYOFWEEKISO(to_timestamp(DATE))) AS DATE_ISODAYOFWEEK, "
        "EXTRACT(day from to_timestamp(DATE)) AS DATE_DAY, "
        "EXTRACT(week from to_timestamp(DATE)) AS DATE_WEEK FROM SELECT_STEP_0)"
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query
        == "SELECT TOTO, RAICHU, FLORIZARRE, DATE, DATE_YEAR, DATE_PREVIOUSDAY, DATE_FIRSTDAYOFPREVIOUSYEAR, "
        "DATE_FIRSTDAYOFPREVIOUSMONTH, DATE_FIRSTDAYOFPREVIOUSWEEK, DATE_DAYOFYEAR, DATE_ISOYEAR, DATE_ISOWEEK, "
        "DATE_ISODAYOFWEEK, DATE_DAY, DATE_WEEK FROM DATEEXTRACT_STEP_1"
    )
    assert query.query_name == 'DATEEXTRACT_STEP_1'

    # assert on metadatas
    assert query.metadata_manager.retrieve_query_metadata_columns() == {
        'DATE': ColumnMetadata(
            name='DATE',
            original_name='DATE',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
        'DATE_DAY': ColumnMetadata(
            name='DATE_DAY',
            original_name='DATE_DAY',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
        'DATE_DAYOFYEAR': ColumnMetadata(
            name='DATE_DAYOFYEAR',
            original_name='DATE_DAYOFYEAR',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
        'DATE_FIRSTDAYOFPREVIOUSMONTH': ColumnMetadata(
            name='DATE_FIRSTDAYOFPREVIOUSMONTH',
            original_name='DATE_FIRSTDAYOFPREVIOUSMONTH',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
        'DATE_FIRSTDAYOFPREVIOUSWEEK': ColumnMetadata(
            name='DATE_FIRSTDAYOFPREVIOUSWEEK',
            original_name='DATE_FIRSTDAYOFPREVIOUSWEEK',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
        'DATE_FIRSTDAYOFPREVIOUSYEAR': ColumnMetadata(
            name='DATE_FIRSTDAYOFPREVIOUSYEAR',
            original_name='DATE_FIRSTDAYOFPREVIOUSYEAR',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
        'DATE_ISODAYOFWEEK': ColumnMetadata(
            name='DATE_ISODAYOFWEEK',
            original_name='DATE_ISODAYOFWEEK',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
        'DATE_ISOWEEK': ColumnMetadata(
            name='DATE_ISOWEEK',
            original_name='DATE_ISOWEEK',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
        'DATE_ISOYEAR': ColumnMetadata(
            name='DATE_ISOYEAR',
            original_name='DATE_ISOYEAR',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
        'DATE_PREVIOUSDAY': ColumnMetadata(
            name='DATE_PREVIOUSDAY',
            original_name='DATE_PREVIOUSDAY',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
        'DATE_WEEK': ColumnMetadata(
            name='DATE_WEEK',
            original_name='DATE_WEEK',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
        'DATE_YEAR': ColumnMetadata(
            name='DATE_YEAR',
            original_name='DATE_YEAR',
            type='DATE',
            original_type='date',
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
    }


def test_translate_with_new_columns_date_extract(query_date):
    step = DateExtractStep(
        name='dateextract', column='DATE', date_info=['year'], new_columns=['ZOZOR']
    )

    query = translate_dateextract(
        step,
        query_date,
        index=1,
    )
    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), DATEEXTRACT_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, "
        "DATE, EXTRACT(year from to_timestamp(DATE)) AS ZOZOR FROM SELECT_STEP_0)"
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query
        == 'SELECT TOTO, RAICHU, FLORIZARRE, DATE, ZOZOR FROM DATEEXTRACT_STEP_1'
    )
    assert query.query_name == 'DATEEXTRACT_STEP_1'

    # assert on metadatas
    assert query.metadata_manager.retrieve_query_metadata_columns() == {
        'DATE': ColumnMetadata(
            name='DATE',
            original_name='DATE',
            type='DATE',
            original_type='date',
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
        'ZOZOR': ColumnMetadata(
            name='ZOZOR',
            original_name='ZOZOR',
            type='DATE',
            original_type='date',
            alias=None,
            delete=False,
        ),
    }


def test_utils_query_for_date_extract():
    date_infos__expected_sql = {
        'year': "EXTRACT(year from to_timestamp(DATE)) AS NEW_COLUMN",
        'month': "EXTRACT(month from to_timestamp(DATE)) AS NEW_COLUMN",
        'day': "EXTRACT(day from to_timestamp(DATE)) AS NEW_COLUMN",
        'week': "EXTRACT(week from to_timestamp(DATE)) AS NEW_COLUMN",
        'quarter': "EXTRACT(quarter from to_timestamp(DATE)) AS NEW_COLUMN",
        'dayOfWeek': "(DAYOFWEEKISO(to_timestamp(DATE)) % 7 + 1) AS NEW_COLUMN",
        'dayOfYear': "EXTRACT(dayofyear from to_timestamp(DATE)) AS NEW_COLUMN",
        'isoYear': "(YEAROFWEEKISO(to_timestamp(DATE))) AS NEW_COLUMN",
        'isoWeek': "(WEEKISO(to_timestamp(DATE))) AS NEW_COLUMN",
        'isoDayOfWeek': "(DAYOFWEEKISO(to_timestamp(DATE))) AS NEW_COLUMN",
        'hour': "EXTRACT(hour from to_timestamp(DATE)) AS NEW_COLUMN",
        'minutes': "EXTRACT(minute from to_timestamp(DATE)) AS NEW_COLUMN",
        'seconds': "EXTRACT(second from to_timestamp(DATE)) AS NEW_COLUMN",
        'milliseconds': "(ROUND(EXTRACT(nanosecond FROM to_timestamp(DATE))/1000000)) AS NEW_COLUMN",
        'firstDayOfYear': "(TO_TIMESTAMP_NTZ(DATE_TRUNC(year, to_timestamp(DATE)))) AS NEW_COLUMN",
        'firstDayOfMonth': "(TO_TIMESTAMP_NTZ(DATE_TRUNC(month, to_timestamp(DATE)))) AS NEW_COLUMN",
        'firstDayOfWeek': "(DATE_TRUNC(day, DATEADD(day, -(DAYOFWEEKISO(to_timestamp(DATE)) % 7 + 1)+1, to_timestamp(DATE)))) AS NEW_COLUMN",
        'firstDayOfIsoWeek': "(DATE_TRUNC(day, DATEADD(day, -DAYOFWEEKISO(to_timestamp(DATE))+1, to_timestamp(DATE)))) AS NEW_COLUMN",
        'firstDayOfQuarter': "(TO_TIMESTAMP_NTZ(DATE_TRUNC(quarter, to_timestamp(DATE)))) AS NEW_COLUMN",
        'previousDay': "(DATE_TRUNC(day, to_timestamp(DATE) - interval '1 day')) AS NEW_COLUMN",
        'firstDayOfPreviousYear': "(TO_TIMESTAMP_NTZ(DATE_TRUNC(year, to_timestamp(DATE))) - interval '1 year') AS NEW_COLUMN",
        'firstDayOfPreviousMonth': "(TO_TIMESTAMP_NTZ(DATE_TRUNC(month, to_timestamp(DATE))) - interval '1 month') AS NEW_COLUMN",
        'firstDayOfPreviousWeek': "(DATE_TRUNC(day, DATEADD(day, -(DAYOFWEEKISO(to_timestamp(DATE)) % 7 + 1)+1, to_timestamp(DATE))) - interval '1 week') AS NEW_COLUMN",
        'firstDayOfPreviousQuarter': "(TO_TIMESTAMP_NTZ(DATE_TRUNC(quarter, to_timestamp(DATE))) - interval '1 quarter') AS NEW_COLUMN",
        'firstDayOfPreviousIsoWeek': "(DATE_TRUNC(day, DATEADD(day, -DAYOFWEEKISO(to_timestamp(DATE))+1, to_timestamp(DATE))) - interval '1 week') AS NEW_COLUMN",
        'previousYear': "(YEAR(to_timestamp(DATE) - interval '1 year')) AS NEW_COLUMN",
        'previousMonth': "(MONTH(to_timestamp(DATE) - interval '1 month')) AS NEW_COLUMN",
        'previousWeek': "(WEEK(to_timestamp(DATE) - interval '1 week')) AS NEW_COLUMN",
        'previousQuarter': "(QUARTER(to_timestamp(DATE) - interval '1 quarter')) AS NEW_COLUMN",
        'previousIsoWeek': "(WEEKISO(to_timestamp(DATE) - interval '1 week')) AS NEW_COLUMN",
    }

    # a loop to evaluate all date-info and the sql output
    for dd in date_infos__expected_sql:
        assert (
            get_query_for_date_extract(
                dd,
                "DATE",
                "NEW_COLUMN",
            )
            == date_infos__expected_sql[dd]
        )
