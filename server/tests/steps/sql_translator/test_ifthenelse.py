from weaverbird.backends.sql_translator.steps import translate_ifthenelse
from weaverbird.pipeline.steps import IfthenelseStep


def test_simple_condition_integer(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'column': 'RAICHU',
                'value': 10,
                'operator': 'gt',
            },
            'newColumn': 'cond',
            'then': '"tintin"',
            'else': '"anime"',
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        "IFF(RAICHU > 10, 'tintin', 'anime') AS COND FROM SELECT_STEP_0) "
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, COND FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_simple_condition_strings(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'column': 'TOTO',
                'value': 'okok',
                'operator': 'eq',
            },
            'newColumn': 'cond',
            'then': '"azoram"',
            'else': '"zigolo"',
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        "IFF(TOTO = 'okok', 'azoram', 'zigolo') AS COND FROM SELECT_STEP_0) "
    )

    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, COND FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_and_condition(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'and': [
                    {
                        'column': 'RAICHU',
                        'value': 10,
                        'operator': 'gt',
                    },
                    {
                        'column': 'TOTO',
                        'value': 'ogadoka',
                        'operator': 'matches',
                    },
                ],
            },
            'newColumn': 'cond',
            'then': '\"tintin\"',
            'else': '\"anime\"',
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        "IFF(RAICHU > 10 AND TOTO RLIKE 'ogadoka', 'tintin', 'anime') AS COND FROM SELECT_STEP_0) "
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, COND FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_or_condition(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'or': [
                    {
                        'column': 'RAICHU',
                        'value': 10,
                        'operator': 'lt',
                    },
                    {
                        'column': 'RAICHU',
                        'value': 1,
                        'operator': 'ge',
                    },
                ],
            },
            'newColumn': 'cond',
            'then': '\"tintin\"',
            'else': '\"anime\"',
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        "IFF(RAICHU < 10 OR RAICHU >= 1, 'tintin', 'anime') AS COND FROM SELECT_STEP_0) "
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, COND FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_then_should_support_nested_else(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'newColumn': 'cond1',
            'if': {
                'or': [
                    {
                        'column': 'RAICHU',
                        'value': 10,
                        'operator': 'lt',
                    },
                    {
                        'column': 'RAICHU',
                        'value': 1,
                        'operator': 'ge',
                    },
                ],
            },
            'then': 3,
            'else': {
                'if': {'column': 'TOTO', 'value': 'zigar', 'operator': 'matches'},
                'newColumn': 'cond2',
                'then': 1,
                'else': {
                    'if': {'column': 'FLORIZARRE', 'value': 'gokar', 'operator': 'eq'},
                    'then': 2,
                    'newColumn': 'cond3',
                    'else': {
                        'if': {'column': 'TOTO', 'value': 'ok', 'operator': 'ne'},
                        'then': 7,
                        'newColumn': 'cond3',
                        'else': {
                            'if': {
                                'column': 'FLORIZARRE',
                                'value': ['ok'],
                                'operator': 'in',
                            },
                            'then': 7,
                            'newColumn': 'cond3',
                            'else': 0,
                        },
                    },
                },
            },
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )

    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        "IFF(RAICHU < 10 OR RAICHU >= 1, 3, IFF(TOTO RLIKE 'zigar', 1, IFF(FLORIZARRE = 'gokar', 2, IFF(TOTO != "
        "'ok', 7, IFF(FLORIZARRE IN ('ok'), 7, 0))))) AS COND1 FROM SELECT_STEP_0) "
    )

    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, COND1 FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_condition_formulas(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'column': 'RAICHU',
                'value': 10,
                'operator': 'gt',
            },
            'newColumn': 'cond',
            'then': 'raichu',
            'else': 'raichu * -1',
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        'IFF(RAICHU > 10, raichu, raichu * -1) AS COND FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, COND FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_condition_null(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {'column': 'RAICHU', 'operator': 'isnull', 'value': None},
            'newColumn': 'cond',
            'then': '1',
            'else': '0',
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        'IFF(RAICHU IS NULL, 1, 0) AS COND FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE, COND FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_simple_condition_with_ambigious_column(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'column': 'RAICHU',
                'value': 10,
                'operator': 'gt',
            },
            'newColumn': 'raichu',
            'then': '"tintin"',
            'else': '"anime"',
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT TOTO, FLORIZARRE, IFF(RAICHU > '
        "10, 'tintin', 'anime') AS RAICHU FROM SELECT_STEP_0)"
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'
