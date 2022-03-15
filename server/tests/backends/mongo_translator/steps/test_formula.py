from weaverbird.backends.mongo_translator.steps import translate_formula
from weaverbird.pipeline.steps import FormulaStep


def test_formula():
    assert translate_formula(
        FormulaStep(
            new_column='mewto',
            formula='mew * 2'
        )
    ) == [{
        '$addFields': {
            'mewto': {
                '$multiply': [
                    '$mew',
                    2
                ]
            }
        }
    }]
