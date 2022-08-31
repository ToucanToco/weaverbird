from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import AbsoluteValueStep


def translate_absolutevalue(step: AbsoluteValueStep) -> list[MongoStep]:
    return [{"$addFields": {step.new_column: {"$abs": f"${step.column}"}}}]
