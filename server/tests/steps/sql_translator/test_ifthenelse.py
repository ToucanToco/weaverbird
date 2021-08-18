from weaverbird.backends.sql_translator.steps import translate_ifthenelse
from weaverbird.pipeline.steps import IfthenelseStep


def test_simple_condition_integer(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'column': 'raichu',
                'value': 10,
                'operator': 'gt',
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
        'IFF(raichu > 10, \'tintin\', \'anime\') AS COND FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre, COND FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_simple_condition_strings(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'column': 'toto',
                'value': 'okok',
                'operator': 'eq',
            },
            'newColumn': 'cond',
            'then': '\"azoram\"',
            'else': '\"zigolo\"',
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        'IFF(toto = \'okok\', \'azoram\', \'zigolo\') AS COND FROM SELECT_STEP_0) '
    )

    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre, COND FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_and_condition(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'and': [
                    {
                        'column': 'raichu',
                        'value': 10,
                        'operator': 'gt',
                    },
                    {
                        'column': 'toto',
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
        'IFF(raichu > 10 AND toto RLIKE \'ogadoka\', \'tintin\', \'anime\') AS COND FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre, COND FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_or_condition(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'or': [
                    {
                        'column': 'raichu',
                        'value': 10,
                        'operator': 'lt',
                    },
                    {
                        'column': 'raichu',
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
        'IFF(raichu < 10 OR raichu >= 1, \'tintin\', \'anime\') AS COND FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre, COND FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_then_should_support_nested_else(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'newColumn': 'cond1',
            'if': {
                'or': [
                    {
                        'column': 'raichu',
                        'value': 10,
                        'operator': 'lt',
                    },
                    {
                        'column': 'raichu',
                        'value': 1,
                        'operator': 'ge',
                    },
                ],
            },
            'then': 3,
            'else': {
                'if': {'column': 'toto', 'value': 'zigar', 'operator': 'matches'},
                'newColumn': 'cond2',
                'then': 1,
                'else': {
                    'if': {'column': 'florizarre', 'value': 'gokar', 'operator': 'eq'},
                    'then': 2,
                    'newColumn': 'cond3',
                    'else': {
                        'if': {'column': 'toto', 'value': 'ok', 'operator': 'ne'},
                        'then': 7,
                        'newColumn': 'cond3',
                        'else': {
                            'if': {
                                'column': 'florizarre',
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
        'IFF(raichu < 10 OR raichu >= 1, 3, IFF(toto RLIKE \'zigar\', 1, IFF(florizarre = \'gokar\', 2, IFF(toto != '
        '\'ok\', 7, IFF(florizarre IN (\'ok\'), 7, 0))))) AS COND1 FROM SELECT_STEP_0) '
    )

    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre, COND1 FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_condition_formulas(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'column': 'raichu',
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
        'IFF(raichu > 10, raichu, raichu * -1) AS COND FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre, COND FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_condition_null(query):
    step = IfthenelseStep(
        **{
            "name": "ifthenelse",
            "if": {"column": "raichu", "operator": "isnull", "value": None},
            "newColumn": "cond",
            "then": "1",
            "else": "0",
        }
    )
    query = translate_ifthenelse(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT TOTO, RAICHU, FLORIZARRE, '
        'IFF(raichu IS NULL, 1, 0) AS COND FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre, COND FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'


def test_simple_condition_with_ambigious_column(query):
    step = IfthenelseStep(
        **{
            'name': 'ifthenelse',
            'if': {
                'column': 'raichu',
                'value': 10,
                'operator': 'gt',
            },
            'newColumn': 'raichu',
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
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), IFTHENELSE_STEP_1 AS (SELECT TOTO, FLORIZARRE, IFF(raichu > '
        '10, \'tintin\', \'anime\') AS RAICHU FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre FROM IFTHENELSE_STEP_1'
    assert query.query_name == 'IFTHENELSE_STEP_1'
