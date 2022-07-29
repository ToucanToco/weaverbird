from typing import List

from weaverbird.backends.mongo_translator.registry import register
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import AbsoluteValueStep


@register
def translate_absolutevalue(step: AbsoluteValueStep) -> List[MongoStep]:
    return [{'$addFields': {step.new_column: {'$abs': f'${step.column}'}}}]
