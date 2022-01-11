import pytest

from weaverbird.backends.sql_translator.metadata import SqlQueryMetadataManager
from weaverbird.backends.sql_translator.steps import translate_convert
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.pipeline.steps import ConvertStep


def test_translate_cast(query):
    step = ConvertStep(name='convert', columns=['RAICHU'], data_type='integer')
    query = translate_convert(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), CONVERT_STEP_1 AS (SELECT TOTO, FLORIZARRE, CAST(RAICHU AS '
        'integer) AS RAICHU FROM SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM CONVERT_STEP_1'
    assert query.query_name == 'CONVERT_STEP_1'


def test_translate_cast_only_one_col():
    step = ConvertStep(name='convert', columns=['RAICHU'], data_type='integer')
    q = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT RAICHU FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(tables_metadata={'table1': {'RAICHU': 'int'}}),
    )
    query = translate_convert(
        step,
        q,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), CONVERT_STEP_1 AS (SELECT CAST(RAICHU AS integer) AS RAICHU '
        'FROM SELECT_STEP_0)'
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT RAICHU FROM CONVERT_STEP_1'
    assert query.query_name == 'CONVERT_STEP_1'


def test_translate_cast_redondant_column_error(query):
    step = ConvertStep(name='convert', columns=['raichu'], data_type='text')

    mock_query = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT toto, raichu, florizarre FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={'table1': {'toto': 'text', 'RAICHU': 'int', 'florizarre': 'text'}},
        ),
    )

    with pytest.raises(AssertionError):
        assert translate_convert(step, query, index=1) == translate_convert(
            step, mock_query, index=1
        )


def test_translate_cast_error(query):
    step = ConvertStep(name='convert', columns=['raichu'], data_type='integer')
    mock_step = ConvertStep(name='convert', columns=['raichu'], data_type='text')

    with pytest.raises(AssertionError):
        assert translate_convert(step, query, index=1) == translate_convert(
            mock_step, query, index=1
        )


def test_translate_cast_float_to_int():
    step = ConvertStep(name='convert', columns=['raichu'], data_type='integer')
    test_query = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT TOTO, RAICHU, FLORIZARRE FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={'TABLE1': {'TOTO': 'text', 'RAICHU': 'float', 'FLORIZARRE': 'text'}},
        ),
    )
    res = translate_convert(step, test_query, index=1)
    assert res.transformed_query == (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), '
        'CONVERT_STEP_1 AS (SELECT TOTO, FLORIZARRE, TRUNCATE(raichu) AS raichu FROM SELECT_STEP_0)'
    )
    assert res.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM CONVERT_STEP_1'
    assert res.query_name == 'CONVERT_STEP_1'
    assert res.metadata_manager.retrieve_query_metadata_column_type_by_name('raichu') == 'INTEGER'


def test_translate_cast_string_to_int(query):
    step = ConvertStep(name='convert', columns=['toto'], data_type='integer')
    res = translate_convert(step, query, index=1)
    assert res.transformed_query == (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), "
        "CONVERT_STEP_1 AS (SELECT RAICHU, FLORIZARRE, CAST(SPLIT_PART(toto, '.', 0) AS integer) AS toto "
        "FROM SELECT_STEP_0)"
    )
    assert res.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM CONVERT_STEP_1'
    assert res.query_name == 'CONVERT_STEP_1'
    assert res.metadata_manager.retrieve_query_metadata_column_type_by_name('toto') == 'INTEGER'


def test_translate_cast_date_to_int():
    step = ConvertStep(name='convert', columns=['toto'], data_type='integer')
    test_query = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT TOTO, RAICHU, FLORIZARRE FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={
                'TABLE1': {'TOTO': 'timestamp_ntz', 'RAICHU': 'float', 'FLORIZARRE': 'text'}
            },
        ),
    )
    res = translate_convert(step, test_query, index=1)
    assert res.transformed_query == (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), "
        "CONVERT_STEP_1 AS (SELECT RAICHU, FLORIZARRE, "
        "CAST(DATE_PART('EPOCH_MILLISECOND', TO_TIMESTAMP(toto)) AS integer) AS toto "
        "FROM SELECT_STEP_0)"
    )
    assert res.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM CONVERT_STEP_1'
    assert res.query_name == 'CONVERT_STEP_1'
    assert res.metadata_manager.retrieve_query_metadata_column_type_by_name('toto') == 'INTEGER'
