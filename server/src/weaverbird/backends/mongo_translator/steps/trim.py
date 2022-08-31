from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import TrimStep


def translate_trim(step: TrimStep) -> list[MongoStep]:
    add_fields = {x: {"$trim": {"input": f"${x}"}} for x in step.columns}

    return [{"$addFields": add_fields}]
