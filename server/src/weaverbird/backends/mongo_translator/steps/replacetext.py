from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps.replacetext import ReplaceTextStep


def translate_replacetext(step: ReplaceTextStep) -> list[MongoStep]:
    return [
        {
            "$set": {
                step.search_column: {
                    "$replaceAll": {
                        "input": f"${step.search_column}",
                        "find": step.old_str,
                        "replacement": step.new_str,
                    }
                }
            }
        }
    ]
