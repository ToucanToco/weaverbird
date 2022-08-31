from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps.fillna import FillnaStep


def translate_fillna(step: FillnaStep) -> list[MongoStep]:
    add_fields = {col: {"$ifNull": [f"${col}", step.value]} for col in step.columns}
    return [{"$addFields": add_fields}]
