from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import SortStep


def translate_sort(step: SortStep) -> list[MongoStep]:
    return [
        {
            "$sort": {
                sort_column.column: 1 if sort_column.order == "asc" else -1
                for sort_column in step.columns
            }
        }
    ]
