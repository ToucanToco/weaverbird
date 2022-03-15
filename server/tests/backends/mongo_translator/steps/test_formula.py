from weaverbird.backends.mongo_translator.steps import translate_formula
from weaverbird.pipeline.steps import FormulaStep


def test_formula_basic_operators():
    assert translate_formula(FormulaStep(new_column='mewto', formula='mew * 2')) == [
        {'$addFields': {'mewto': {'$multiply': ['$mew', 2]}}}
    ]
    assert translate_formula(FormulaStep(new_column='plant', formula='4 + 5')) == [
        {'$addFields': {'plant': {'$add': [4, 5]}}}
    ]
    assert translate_formula(FormulaStep(new_column='diff', formula='you - two')) == [
        {'$addFields': {'diff': {'$subtract': ['$you', '$two']}}}
    ]
    assert translate_formula(FormulaStep(new_column='conquer', formula='1 / pi')) == [
        {'$addFields': {'conquer': {'$divide': [1, '$pi']}}}
    ]


def test_formula_with_unique_value():
    assert translate_formula(FormulaStep(new_column='sacred', formula='graal')) == [
        {'$addFields': {'sacred': '$graal'}}
    ]
    assert translate_formula(FormulaStep(new_column='team_number', formula='10')) == [
        {'$addFields': {'team_number': 10}}
    ]


def test_formula_nested():
    assert translate_formula(
        FormulaStep(new_column='foo', formula='(column_1 + column_2) / column_3 - column_4 * 100')
    ) == [
        {
            '$addFields': {
                'foo': {
                    '$subtract': [
                        {
                            '$divide': [
                                {
                                    '$add': ['$column_1', '$column_2'],
                                },
                                '$column_3',
                            ],
                        },
                        {
                            '$multiply': ['$column_4', 100],
                        },
                    ],
                },
            }
        }
    ]

    assert translate_formula(
        FormulaStep(new_column='bar', formula='1 / ((column_1 + column_2 + column_3)) * 10')
    ) == [
        {
            '$addFields': {
                'bar': {
                    '$multiply': [
                        {
                            '$divide': [
                                1,
                                {
                                    '$add': [
                                        {
                                            '$add': ['$column_1', '$column_2'],
                                        },
                                        '$column_3',
                                    ],
                                },
                            ],
                        },
                        10,
                    ],
                }
            }
        }
    ]

    assert translate_formula(
        FormulaStep(new_column='test_precedence', formula='column_1 + column_2 + column_3 * 10')
    ) == [
        {
            '$addFields': {
                'test_precedence': {
                    '$add': [
                        {
                            '$add': ['$column_1', '$column_2'],
                        },
                        {
                            '$multiply': ['$column_3', 10],
                        },
                    ],
                }
            }
        }
    ]


def test_signed_column_name():
    assert translate_formula(FormulaStep(new_column='test', formula='-column_1 + 10')) == [
        {
            '$addFields': {
                'test': {
                    '$add': [
                        {
                            '$multiply': [-1, '$column_1'],
                        },
                        10,
                    ],
                }
            }
        }
    ]
