from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps.moving_average import MovingAverageStep


def translate_moving_average(step: MovingAverageStep) -> list[MongoStep]:
    return [
        # Ensure the reference column is sorted to prepare for the moving average computation
        {"$sort": {step.column_to_sort: 1}},
        # If needing to group the computation, provide for the columns, else _id is set to None
        {
            "$group": {
                "_id": {col: f"${col}" for col in step.groups} if step.groups else None,
                "_vqbArray": {"$push": "$$ROOT"},
            },
        },
        # Prepare an array of documents with a new moving average field. One array per group (if any)
        {
            "$addFields": {
                "_vqbArray": {
                    # We use $map to apply operations while looping over the _vqbArray documents
                    "$map": {
                        # We create an index ("idx") variable that will go from 0 to the size of _vqbArray
                        "input": {"$range": [0, {"$size": "$_vqbArray"}]},
                        "as": "idx",
                        # We will use the idx variable in the following stages
                        "in": {
                            "$cond": [
                                # If the index is less than the moving window minus 1...
                                {
                                    "$lt": ["$$idx", (step.moving_window) - 1]
                                },  # explicit type for typescript
                                # ... then we cannot apply the moving average computation, and
                                # we just keep the original document without any new field...
                                {"$arrayElemAt": ["$_vqbArray", "$$idx"]},
                                # ... else we compute the value average over the last N documents starting
                                # from the current index document, N being equal to the moving window)
                                {
                                    "$mergeObjects": [
                                        # Keep track of original document
                                        {"$arrayElemAt": ["$_vqbArray", "$$idx"]},
                                        # and add the new moving average column
                                        {
                                            step.new_column_name
                                            or f"{step.value_column}_MOVING_AVG": {
                                                "$avg": {
                                                    "$slice": [
                                                        f"$_vqbArray.{step.value_column}",
                                                        {
                                                            "$subtract": [
                                                                "$$idx",
                                                                step.moving_window - 1,
                                                            ]
                                                        },  # explicit type for typescript
                                                        step.moving_window,
                                                    ],
                                                },
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
        },
        # Flatten the array(s) to get back to 1 row per document (at this stage in the field "_vqbArray")
        {"$unwind": "$_vqbArray"},
        # Set the _vqbArray field as the new root to get back to the original document granularity
        {"$replaceRoot": {"newRoot": "$_vqbArray"}},
    ]
