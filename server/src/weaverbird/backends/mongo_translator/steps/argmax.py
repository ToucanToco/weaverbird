from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import ArgmaxStep


def translate_argmax(step: ArgmaxStep) -> list[MongoStep]:
    return [
        {
            "$group": {
                "_id": {group: f"${group}" for group in step.groups},
                "_vqbAppArray": {"$push": "$$ROOT"},
                "_vqbAppValueToCompare": {"$max": f"${step.column}"},
            }
        },
        {"$unwind": "$_vqbAppArray"},
        {"$replaceRoot": {"newRoot": {"$mergeObjects": ["$_vqbAppArray", "$$ROOT"]}}},
        {"$project": {"_vqbAppArray": 0}},
        {
            "$redact": {
                "$cond": [
                    {"$eq": [f"${step.column}", "$_vqbAppValueToCompare"]},
                    "$$KEEP",
                    "$$PRUNE",
                ]
            }
        },
        {"$project": {"_vqbAppValueToCompare": 0}},
    ]
