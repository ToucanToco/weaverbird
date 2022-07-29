import json
from typing import List

from weaverbird.backends.mongo_translator.registry import register
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import CustomStep


@register
def translate_custom(step: CustomStep) -> List[MongoStep]:
    output = json.loads(step.query)
    return output if isinstance(output, list) else [output]
