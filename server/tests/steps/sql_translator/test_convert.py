import pytest

from weaverbird.backends.sql_translator.steps import translate_convert
from weaverbird.pipeline.steps import ConvertStep


def test_translate_cast(query):
    step = ConvertStep(name='convert', columns=['raichu'], data_type='integer')
    query = translate_convert(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), CONVERT_STEP_1 AS (SELECT toto, florizarre, CAST(raichu AS '
        'integer) AS raichu FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre FROM CONVERT_STEP_1'
    assert query.query_name == 'CONVERT_STEP_1'


def test_translate_cast_error(query):
    step = ConvertStep(name='convert', columns=['raichu'], data_type='integer')
    mock_step = ConvertStep(name='convert', columns=['raichu'], data_type='text')

    with pytest.raises(AssertionError):
        assert translate_convert(step, query, index=1) == translate_convert(
            mock_step, query, index=1
        )
