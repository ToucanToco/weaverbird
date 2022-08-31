from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import DuplicateStep


def translate_duplicate(step: DuplicateStep) -> list[MongoStep]:
    return [
        {
            "$addFields": {(step.new_column_name): f"${step.column}"},
        }
    ]
