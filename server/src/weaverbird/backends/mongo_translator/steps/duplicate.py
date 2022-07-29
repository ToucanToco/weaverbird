from typing import List

from weaverbird.backends.mongo_translator.registry import register
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import DuplicateStep


@register
def translate_duplicate(step: DuplicateStep) -> List[MongoStep]:
    return [
        {
            '$addFields': {(step.new_column_name): f'${step.column}'},
        }
    ]
