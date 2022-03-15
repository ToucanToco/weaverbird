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
