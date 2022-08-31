from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import UppercaseStep


def translate_uppercase(step: UppercaseStep) -> list[MongoStep]:
    return [{"$addFields": {step.column: {"$toUpper": f"${step.column}"}}}]
