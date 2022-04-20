from typing import List

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import SelectStep


def translate_select(step: SelectStep) -> List[MongoStep]:
    return [{'$project': {f'{column}': 1 for column in step.columns}}]
