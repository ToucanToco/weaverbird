from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import UnpivotStep


def translate_unpivot(step: UnpivotStep) -> list[MongoStep]:
    # project_cols to be included in Mongo $project steps
    project_cols = {col: f"${col}" for col in step.keep}
    # object_to_array to be included in the first Mongo $project step
    object_to_array = {col: {"$ifNull": [f"${col}", None]} for col in step.unpivot}

    mongo_pipeline: list[dict] = [
        {
            "$project": {**project_cols, "_vqbToUnpivot": {"$objectToArray": object_to_array}},
        },
        {
            "$unwind": "$_vqbToUnpivot",
        },
        {
            "$project": {
                **project_cols,
                step.unpivot_column_name: "$_vqbToUnpivot.k",
                step.value_column_name: "$_vqbToUnpivot.v",
            },
        },
    ]

    if step.dropna:
        mongo_pipeline.append({"$match": {step.value_column_name: {"$ne": None}}})

    return mongo_pipeline
