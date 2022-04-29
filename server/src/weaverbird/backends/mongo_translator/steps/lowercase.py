from typing import List

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import LowercaseStep


def translate_lowercase(step: LowercaseStep) -> List[MongoStep]:
    return [{'$addFields': {step.column: {'$toLower': f'${step.column}'}}}]
