from typing import List

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import SortStep


def translate_sort(step: SortStep) -> List[MongoStep]:
    sort_mongo = {}
    for sort_column in step.columns:
        sort_mongo[sort_column.column] = 1 if sort_column.order == 'asc' else -1
    return [{'$sort': sort_mongo}]
