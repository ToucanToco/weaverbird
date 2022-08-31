import json

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import CustomStep


def translate_custom(step: CustomStep) -> list[MongoStep]:
    output = json.loads(step.query)
    return output if isinstance(output, list) else [output]
