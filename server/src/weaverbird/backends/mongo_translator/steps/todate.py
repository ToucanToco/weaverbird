from typing import List

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import ToDateStep


def translate_todate(step: ToDateStep) -> List[MongoStep]:
    return [{'$addFields': {step.column: {'$dateFromString': {'dateString': f'${step.column}'}}}}]
