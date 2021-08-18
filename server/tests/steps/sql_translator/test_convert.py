import pytest

from weaverbird.backends.sql_translator.steps import translate_convert
from weaverbird.backends.sql_translator.types import SQLQuery, SqlQueryMetadataManager
from weaverbird.pipeline.steps import ConvertStep


def test_translate_cast(query):
    step = ConvertStep(name='convert', columns=['raichu'], data_type='integer')
    query = translate_convert(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), CONVERT_STEP_1 AS (SELECT TOTO, FLORIZARRE, CAST(raichu AS '
        'integer) AS RAICHU FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre FROM CONVERT_STEP_1'
    assert query.query_name == 'CONVERT_STEP_1'


def test_translate_cast_only_one_col():
    step = ConvertStep(name='convert', columns=['raichu'], data_type='integer')
    q = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT raichu FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={'table1': {'raichu': 'int'}}, query_metadata={'raichu': 'int'}
        ),
    )
    query = translate_convert(
        step,
        q,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), CONVERT_STEP_1 AS (SELECT CAST(raichu AS integer) AS RAICHU '
        'FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT raichu FROM CONVERT_STEP_1'
    assert query.query_name == 'CONVERT_STEP_1'


def test_translate_cast_redondant_column_error(query):
    step = ConvertStep(name='convert', columns=['raichu'], data_type='text')

    mock_query = SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT toto, raichu, florizarre FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={'table1': {'toto': 'str', 'RAICHU': 'int', 'florizarre': 'str'}},
            query_metadata={'toto': 'str', 'RAICHU': 'int', 'florizarre': 'str'},
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
