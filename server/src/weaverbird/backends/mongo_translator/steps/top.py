from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps.top import TopStep


def translate_top(step: TopStep) -> list[MongoStep]:
    sort_order = 1 if step.sort == "asc" else -1
    group_cols = {g: f"${g}" for g in step.groups} if step.groups else None
    return [
        {"$sort": {step.rank_on: sort_order}},
        {"$group": {"_id": group_cols, "_vqbAppArray": {"$push": "$$ROOT"}}},
        {"$project": {"_vqbAppTopElems": {"$slice": ["$_vqbAppArray", step.limit]}}},
        {"$unwind": "$_vqbAppTopElems"},
        {"$replaceRoot": {"newRoot": "$_vqbAppTopElems"}},
    ]
