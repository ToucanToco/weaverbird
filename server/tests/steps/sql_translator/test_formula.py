import pytest

from weaverbird.backends.sql_translator.steps import translate_formula
from weaverbird.pipeline.steps import FormulaStep

QUERY_NAME = 'FORMULA_STEP_1'
SELECTION_QUERY = f'SELECT TOTO, RAICHU, FLORIZARRE, RESULT FROM {QUERY_NAME}'


@pytest.mark.parametrize(
    'expected_transformed_query, formula',
    [
        (
            f'WITH SELECT_STEP_0 AS (SELECT * FROM products), {QUERY_NAME} AS (SELECT TOTO, RAICHU, FLORIZARRE, 1 + 1 '
            'AS RESULT FROM SELECT_STEP_0)',
            '1 + 1',
        ),
        (
            f'WITH SELECT_STEP_0 AS (SELECT * FROM products), {QUERY_NAME} AS (SELECT TOTO, RAICHU, FLORIZARRE, '
            'PIKA - PIKA AS RESULT FROM SELECT_STEP_0)',
            'PIKA - PIKA',
        ),
        (
            f'WITH SELECT_STEP_0 AS (SELECT * FROM products), {QUERY_NAME} AS (SELECT TOTO, RAICHU, FLORIZARRE, '
            'PIKA + "PIKA AKIP" AS RESULT FROM SELECT_STEP_0)',
            'PIKA + "PIKA AKIP"',
        ),
        (
            f'WITH SELECT_STEP_0 AS (SELECT * FROM products), {QUERY_NAME} AS (SELECT TOTO, RAICHU, FLORIZARRE, '
            'PIKA * 2 AS RESULT FROM SELECT_STEP_0)',
            'PIKA * 2',
        ),
        (
            f'WITH SELECT_STEP_0 AS (SELECT * FROM products), {QUERY_NAME} AS (SELECT TOTO, RAICHU, FLORIZARRE, '
            'PIKA + 2 * AKIP - "PIKU UKIP" AS RESULT FROM SELECT_STEP_0)',
            'PIKA + 2 * AKIP - "PIKU UKIP"',
        ),
    ],
)
def test_translate_formula_simple(query, expected_transformed_query, formula):
    step = FormulaStep(name='formula', new_column='RESULT', formula=formula)
    query = translate_formula(
        step,
        query,
        index=1,
    )
    assert query.transformed_query == expected_transformed_query
    assert query.query_name == QUERY_NAME
    assert query.selection_query == SELECTION_QUERY


@pytest.mark.parametrize(
    'expected_transformed_query, formula',
    [
        (
            f'WITH SELECT_STEP_0 AS (SELECT * FROM products), {QUERY_NAME} AS (SELECT TOTO, RAICHU, FLORIZARRE,'
            ' 1 / NULLIF(1, 0) AS RESULT FROM SELECT_STEP_0)',
            '1 / 1',
        ),
        (
            f'WITH SELECT_STEP_0 AS (SELECT * FROM products), {QUERY_NAME} AS (SELECT TOTO, RAICHU, FLORIZARRE, '
            'PIKA / NULLIF(PIKA, 0) AS RESULT FROM SELECT_STEP_0)',
            'PIKA / PIKA',
        ),
        (
            f'WITH SELECT_STEP_0 AS (SELECT * FROM products), {QUERY_NAME} AS (SELECT TOTO, RAICHU, FLORIZARRE, '
            'PIKA / NULLIF(PIKA, 0) * 12 AS RESULT FROM SELECT_STEP_0)',
            'PIKA / PIKA * 12',
        ),
    ],
)
def test_translate_formula_with_div(query, expected_transformed_query, formula):
    step = FormulaStep(name='formula', new_column='RESULT', formula=formula)
    query = translate_formula(
        step,
        query,
        index=1,
    )
    assert query.transformed_query == expected_transformed_query
    assert query.query_name == QUERY_NAME
    assert query.selection_query == SELECTION_QUERY
