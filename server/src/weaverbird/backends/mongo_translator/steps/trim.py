from typing import List

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import TrimStep


def translate_trim(step: TrimStep) -> List[MongoStep]:
    cols = step.columns or []

    add_fields = {x: {'$trim': {'input': f'${x}'}} for x in cols}

    return [{'$addFields': add_fields}]
