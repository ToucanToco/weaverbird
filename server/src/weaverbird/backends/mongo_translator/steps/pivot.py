from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps.pivot import PivotStep


def translate_pivot(step: PivotStep) -> list[MongoStep]:
    group_cols = {}
    add_fields_step = {}

    # Prepare groupCols to populate the `_id` field sof Mongo `$group` steps and addFields step
    for col in step.index:
        group_cols[col] = f"$_id.{col}"
        add_fields_step[f"_vqbAppTmpObj.{col}"] = f"$_id.{col}"

    pivot_mongo_agg_stages: list[MongoStep] = [
        # First we perform the aggregation with the _id including the column to pivot
        {
            "$group": {
                "_id": {
                    **{col: f"${col}" for col in step.index},
                    step.column_to_pivot: f"${step.column_to_pivot}",
                },
                step.value_column: {f"${step.agg_function}": f"${step.value_column}"},
            },
        },
        # Then we group with with index columns as _id and we push documents as an array of sets
        # including a column for the column to pivot and a column for the corresponding value
        {
            "$group": {
                "_id": group_cols,
                "_vqbAppArray": {
                    "$addToSet": {
                        step.column_to_pivot: f"$_id.{step.column_to_pivot}",
                        step.value_column: f"${step.value_column}",
                    },
                },
            },
        },
        # Then we project a tmp key to get an object from the array of couples [column_to_pivot, corresponding_value]
        # including a column for the column to pivot and a column for the corresponding value
        {
            "$project": {
                "_vqbAppTmpObj": {
                    "$arrayToObject": {
                        "$zip": {
                            "inputs": [
                                f"$_vqbAppArray.{step.column_to_pivot}",
                                f"$_vqbAppArray.{step.value_column}",
                            ],
                        },
                    },
                },
            },
        },
    ]

    if add_fields_step:
        # Then we include the index columns back in every document created in the previous step
        # (still accessible in the _id object)
        pivot_mongo_agg_stages.append({"$addFields": add_fields_step})

    # Then we replace the root of the documents tree to get our columns ready for
    # our needed table-like, unnested format
    pivot_mongo_agg_stages.append({"$replaceRoot": {"newRoot": "$_vqbAppTmpObj"}})

    return pivot_mongo_agg_stages
