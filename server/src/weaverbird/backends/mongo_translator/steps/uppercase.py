from typing import List

from weaverbird.backends.mongo_translator.registry import register
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import UppercaseStep


@register
def translate_uppercase(step: UppercaseStep) -> List[MongoStep]:
    return [{'$addFields': {step.column: {'$toUpper': f'${step.column}'}}}]
