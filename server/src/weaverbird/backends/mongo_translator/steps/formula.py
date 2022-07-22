from weaverbird.backends.utils.formula import MongoFormulaBuilder
from weaverbird.pipeline.steps.formula import FormulaStep


def translate_formula(step: FormulaStep) -> list:
    return MongoFormulaBuilder.translate_formula(step)
