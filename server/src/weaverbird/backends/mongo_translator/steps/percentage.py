from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import PercentageStep


def translate_percentage(step: PercentageStep) -> list[MongoStep]:
    return [
        {
            "$group": {
                "_id": {g: f"${g}" for g in step.group} if step.group else None,
                "_vqbAppArray": {"$push": "$$ROOT"},
                "_vqbTotalDenum": {"$sum": f"${step.column }"},
            },
        },
        {"$unwind": "$_vqbAppArray"},
        {
            "$project": {
                step.new_column_name: {
                    "$cond": [
                        {"$eq": ["$_vqbTotalDenum", 0]},
                        None,
                        {"$divide": [f"$_vqbAppArray.{step.column}", "$_vqbTotalDenum"]},
                    ],
                },
                "_vqbAppArray": 1,  # we need to keep track of this key for the next operation
            },
        },
        # Line below: Keep all columns that were not used in computation, 'stored' in _vqbAppArray
        {"$replaceRoot": {"newRoot": {"$mergeObjects": ["$_vqbAppArray", "$$ROOT"]}}},
        {"$project": {"_vqbAppArray": 0}},  # We do not want to keep that column at the end
    ]
