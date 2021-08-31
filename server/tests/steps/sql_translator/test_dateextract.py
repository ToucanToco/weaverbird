import pytest

from weaverbird.backends.sql_translator.metadata import SqlQueryMetadataManager
from weaverbird.backends.sql_translator.steps import translate_dateextract
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
                'TABLE1': {'TOTO': 'str', 'RAICHU': 'int', 'FLORIZARRE': 'str', 'DATE': 'date'}
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
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), DATEEXTRACT_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, "
        "DATE, EXTRACT(year from to_timestamp(DATE)) AS DATE_YEAR, (to_timestamp(DATE) - interval '1 day') AS "
        "DATE_PREVIOUSDAY, ((to_timestamp(DATE) - interval '1 year') + interval '1 day') AS "
        "DATE_FIRSTDAYOFPREVIOUSYEAR, ((to_timestamp(DATE) - interval '2 month') + interval '1 day') AS "
        "DATE_FIRSTDAYOFPREVIOUSMONTH, (DAY(to_timestamp(DATE) - interval '1 week') - DAYOFWEEKISO(to_timestamp("
        "DATE)) + 1) AS DATE_FIRSTDAYOFPREVIOUSWEEK, EXTRACT(dayofyear from to_timestamp(DATE)) AS DATE_DAYOFYEAR, "
        "(YEAROFWEEKISO(to_timestamp(DATE))) AS DATE_ISOYEAR, (WEEKISO(to_timestamp(DATE))) AS DATE_ISOWEEK, "
        "(DAYOFWEEKISO(to_timestamp(DATE))) AS DATE_ISODAYOFWEEK, EXTRACT(day from to_timestamp(DATE)) AS DATE_DAY, "
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
