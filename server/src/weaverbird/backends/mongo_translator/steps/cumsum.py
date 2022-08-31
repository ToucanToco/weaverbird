from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps.cumsum import CumSumStep


def translate_cumsum(step: CumSumStep) -> list[MongoStep]:
    groupby = step.groupby or []

    return [
        {"$sort": {step.reference_column: 1}},
        {
            "$group": {
                "_id": {col: f"${col}" for col in groupby} if step.groupby else None,
                **{x: {"$push": f"${x}"} for x, _ in step.to_cumsum},
                "_vqbArray": {"$push": "$$ROOT"},
            },
        },
        {"$unwind": {"path": "$_vqbArray", "includeArrayIndex": "_VQB_INDEX"}},
        {
            "$project": {
                **{col: f"$_id.{col}" for col in groupby},
                **{
                    new_name
                    if new_name
                    else f"{name}_CUMSUM": {
                        "$sum": {"$slice": [f"${name}", {"$add": ["$_VQB_INDEX", 1]}]}
                    }
                    for name, new_name in step.to_cumsum
                },
                "_vqbArray": 1,
            },
        },
        {"$replaceRoot": {"newRoot": {"$mergeObjects": ["$_vqbArray", "$$ROOT"]}}},
        {"$project": {"_vqbArray": 0}},
    ]
