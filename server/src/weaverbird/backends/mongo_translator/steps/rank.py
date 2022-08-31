from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import RankStep


def translate_rank(step: RankStep) -> list[MongoStep]:

    """
    Here we define the order variable that will be used in the '$reduce' step
    defined below. The order definition depends on the ranking method chosen.

    Example of ranking output depending on method chosen:

     - standard: [10, 15, 15, 15, 20, 20, 22] => [1, 2, 2, 2, 5, 5, 7]
     - dense: [10, 15, 15, 15, 20, 20, 22] => [1, 2, 2, 2, 3, 3, 4]

    Notes on special Mongo variables used in the '$reduce' step defined below:

     - '$$this' refers to the element being processed
     - '$$value' refers to the cumulative value of the expression
    """
    vqb_var_order: MongoStep = {}

    if step.method == "dense":
        vqb_var_order = {
            "$cond": [
                {"$ne": [f"$$this.{step.value_col}", "$$value.prevValue"]},
                {"$add": ["$$value.order", 1]},
                "$$value.order",
            ],
        }
    else:
        vqb_var_order = {"$add": ["$$value.order", 1]}

    """
    This is the variable object used in the '$reduce' step described below (see
    the object structure in the 'rankedArray' doc below). It's here that we
    compute the rank, that compares two consecutive documents in sorted arrays
    and which definition depends on the ranking method chosen (see above)

    Notes on special Mongo variables used in the '$reduce' step defined below:

    - '$$this' refers to the element being processed
    - '$$value' refers to the cumulative value of the expression
    """
    vqb_var_obj: MongoStep = {
        "$let": {
            "vars": {
                "order": vqb_var_order,
                "rank": {
                    "$cond": [
                        {"$ne": [f"$$this.{step.value_col}", "$$value.prevValue"]},
                        {"$add": ["$$value.order", 1]},
                        "$$value.prevRank",
                    ],
                },
            },
            "in": {
                "a": {
                    "$concatArrays": [
                        "$$value.a",
                        [
                            {
                                "$mergeObjects": [
                                    "$$this",
                                    {
                                        (
                                            step.new_column_name
                                            if step.new_column_name
                                            else f"{step.value_col}_RANK"
                                        ): "$$rank"
                                    },
                                ],
                            },
                        ],
                    ],
                },
                "order": "$$order",
                "prevValue": f"$$this.{step.value_col}",
                "prevRank": "$$rank",
            },
        },
    }

    """
    This step transforms sorted arrays (1 array per group as specified by the
    'groupby' parameter) of documents into an array of the same sorted documents,
    with the information of ranking of each document added ionto each(key 'rank).

    To do so we reduce orignal arrays in one document each with the structure:
    {
        a: [ < list of sorted documents with rank key added > ],
        order: < an order counter >,
        prevValue: < to keep track of previous document value >,
        prevRank: < to keep track of previous document rank >
    }

    At the end we just extract the 'a' array (as other keys were only useful as
    variables in the '$reduce' step)
    """
    ranked_array: MongoStep = {
        "$let": {
            "vars": {
                "reducedArrayInObj": {
                    "$reduce": {
                        "input": "$_vqbArray",
                        "initialValue": {
                            "a": [],
                            "order": 0,
                            "prevValue": None,
                            "prevRank": None,
                        },
                        "in": vqb_var_obj,
                    },
                },
            },
            "in": "$$reducedArrayInObj.a",
        },
    }

    return [
        {"$sort": {(step.value_col): 1 if step.order == "asc" else -1}},
        {
            "$group": {
                "_id": [[c, f"${c}"] for c in step.groupby] if step.groupby else None,
                "_vqbArray": {"$push": "$$ROOT"},
            },
        },
        {"$project": {"_vqbSortedArray": ranked_array}},
        {"$unwind": "$_vqbSortedArray"},
        {"$replaceRoot": {"newRoot": "$_vqbSortedArray"}},
    ]
