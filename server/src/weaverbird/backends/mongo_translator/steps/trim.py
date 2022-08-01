from typing import List

from weaverbird.backends.mongo_translator.registry import register
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import TrimStep


@register
def translate_trim(step: TrimStep) -> List[MongoStep]:
    add_fields = {x: {'$trim': {'input': f'${x}'}} for x in step.columns}

    return [{'$addFields': add_fields}]
