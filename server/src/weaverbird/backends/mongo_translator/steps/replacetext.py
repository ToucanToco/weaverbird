from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps.replacetext import ReplaceTextStep


def translate_replacetext(step: ReplaceTextStep) -> list[MongoStep]:
    branches: list[MongoStep] = [
        {
            "case": {"$eq": [f"${step.search_column}", step.old_str]},
            "then": step.new_str,
        }
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
