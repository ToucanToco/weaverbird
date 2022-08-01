from typing import List

from weaverbird.backends.mongo_translator.registry import register
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps.fillna import FillnaStep


@register
def translate_fillna(step: FillnaStep) -> List[MongoStep]:
    add_fields = {col: {'$ifNull': [f'${col}', step.value]} for col in step.columns}
    return [{'$addFields': add_fields}]
