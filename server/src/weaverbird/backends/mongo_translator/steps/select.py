from typing import List

from weaverbird.backends.mongo_translator.registry import register
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import SelectStep


@register
def translate_select(step: SelectStep) -> List[MongoStep]:
    return [{'$project': {f'{column}': 1 for column in step.columns}}]
