from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import SplitStep


def translate_split(step: SplitStep) -> list[MongoStep]:
    add_fields_step = {}
    for i in range(1, step.number_cols_to_keep + 1):
        add_fields_step[f"{step.column}_{i}"] = {"$arrayElemAt": ["$_vqbTmp", i - 1]}

    return [
        {"$addFields": {"_vqbTmp": {"$split": [f"${step.column}", step.delimiter]}}},
        {"$addFields": add_fields_step},
        {"$project": {"_vqbTmp": 0}},
    ]
