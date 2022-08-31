from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import LowercaseStep


def translate_lowercase(step: LowercaseStep) -> list[MongoStep]:
    return [{"$addFields": {step.column: {"$toLower": f"${step.column}"}}}]
