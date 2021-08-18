import pytest

from weaverbird.backends.sql_translator.steps import translate_sort
from weaverbird.pipeline.steps import SortStep
from weaverbird.pipeline.steps.sort import ColumnSort


def test_translate_sort(query):
    step = SortStep(
        name='sort',
        columns=[
            ColumnSort(column='TOTO', order='asc'),
            ColumnSort(column='RAICHU', order='desc'),
        ],
    )
    query = translate_sort(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), SORT_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE FROM '
        'SELECT_STEP_0 ORDER BY TOTO asc, RAICHU desc) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM SORT_STEP_1'
    assert query.query_name == 'SORT_STEP_1'


def test_translate_sort_error(query):
    step = SortStep(
        name='sort',
        columns=[
            ColumnSort(column='TOTO', order='asc'),
            ColumnSort(column='RAICHU', order='desc'),
        ],
    )
    mock_step = SortStep(
        name='sort',
        columns=[
            ColumnSort(column='TOTO', order='desc'),
        ],
    )

    with pytest.raises(AssertionError):
        assert (
            translate_sort(mock_step, query, index=1).transformed_query
            == translate_sort(step, query, index=1).transformed_query
        )
