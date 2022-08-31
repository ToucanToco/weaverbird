from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import ReplaceStep


def translate_replace(step: ReplaceStep) -> list[MongoStep]:
    branches: list[MongoStep] = [
        {
            "case": {"$eq": [f"${step.search_column}", old_value]},
            "then": new_value,
        }
        for (old_value, new_value) in step.to_replace
    ]
    return [
        {
            "$addFields": {
                f"{step.search_column}": {
                    "$switch": {"branches": branches, "default": f"${step.search_column}"},
                }
            }
        }
    ]
