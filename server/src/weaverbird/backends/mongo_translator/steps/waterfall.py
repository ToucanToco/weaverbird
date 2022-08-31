from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import WaterfallStep


def translate_waterfall(step: WaterfallStep) -> list[MongoStep]:
    concatMongo = {}
    facet = {}
    groupby = step.groupby
    parents = [step.parentsColumn] if step.parentsColumn else []

    def _column_map(colnames: list) -> dict:
        return {col: f"${col}" for col in colnames}

    # Pipeline that will be executed to get the array of results for the starting
    # and ending milestone of the waterfall
    facetStartEnd = [
        {
            "$group": {
                "_id": _column_map(groupby + [step.milestonesColumn]),
                step.valueColumn: {"$sum": f"${step.valueColumn}"},
            },
        },
        {
            "$project": {
                **{col: f"$_id.{col}" for col in groupby},
                "LABEL_waterfall": f"$_id.{step.milestonesColumn}",
                **(
                    {"GROUP_waterfall": f"$_id.{step.milestonesColumn}"}
                    if step.parentsColumn
                    else {}
                ),
                "TYPE_waterfall": None,
                step.valueColumn: 1,
                "_vqbOrder": {
                    "$cond": [{"$eq": [f"$_id.{step.milestonesColumn}", step.start]}, -1, 1]
                },
            },
        },
    ]

    # Pipeline that will be executed to get the array of results for the children
    # elements of the waterfall
    facetChildren = [
        {
            "$group": {
                "_id": _column_map(
                    groupby + parents + [step.labelsColumn] + [step.milestonesColumn]
                ),
                step.valueColumn: {"$sum": f"${step.valueColumn}"},
            },
        },
        {
            "$addFields": {
                "_vqbOrder": {
                    "$cond": [{"$eq": [f"$_id.{step.milestonesColumn}", step.start]}, 1, 2]
                },
            },
        },
        {"$sort": {"_vqbOrder": 1}},
        {
            "$group": {
                "_id": {col: f"$_id.{col}" for col in groupby + parents + [step.labelsColumn]},
                "_vqbValuesArray": {"$push": f"${step.valueColumn}"},
            },
        },
        {
            "$project": {
                **{col: f"$_id.{col}" for col in groupby},
                "LABEL_waterfall": f"$_id.{step.labelsColumn}",
                **({"GROUP_waterfall": f"$_id.{step.parentsColumn}"} if step.parentsColumn else {}),
                "TYPE_waterfall": "child" if step.parentsColumn else "parent",
                step.valueColumn: {
                    "$reduce": {
                        "input": "$_vqbValuesArray",
                        "initialValue": 0,
                        "in": {"$subtract": ["$$this", "$$value"]},
                    },
                },
                "_vqbOrder": {"$literal": 0},
            },
        },
    ]

    # If.parentsColumn is define, we set the pipeline that will be executed to
    # get the array of results for the parents elements of the waterfall. In such
    # a case we add it to the concatenation of all the pipelines results arrays
    if step.parentsColumn:
        facetParents = [
            {
                "$group": {
                    "_id": _column_map(groupby + parents + [step.milestonesColumn]),
                    step.valueColumn: {"$sum": f"${step.valueColumn}"},
                },
            },
            {
                "$addFields": {
                    "_vqbOrder": {
                        "$cond": [{"$eq": [f"$_id.{step.milestonesColumn}", step.start]}, 1, 2]
                    },
                },
            },
            {"$sort": {"_vqbOrder": 1}},
            {
                "$group": {
                    "_id": {col: f"$_id.{col}" for col in groupby + parents},
                    "_vqbValuesArray": {"$push": f"${step.valueColumn}"},
                },
            },
            {
                "$project": {
                    **{col: f"$_id.{col}" for col in groupby},
                    "LABEL_waterfall": f"$_id.{step.parentsColumn}",
                    "GROUP_waterfall": f"$_id.{step.parentsColumn}",
                    "TYPE_waterfall": "parent",
                    (step.valueColumn): {
                        "$reduce": {
                            "input": "$_vqbValuesArray",
                            "initialValue": 0,
                            "in": {"$subtract": ["$$this", "$$value"]},
                        },
                    },
                    "_vqbOrder": {"$literal": 0},
                },
            },
        ]

        facet = {
            "_vqb_start_end": facetStartEnd,
            "_vqb_parents": facetParents,
            "_vqb_children": facetChildren,
        }
        concatMongo = {"$concatArrays": ["$_vqb_start_end", "$_vqb_parents", "$_vqb_children"]}
    else:
        facet = {"_vqb_start_end": facetStartEnd, "_vqb_children": facetChildren}
        concatMongo = {"$concatArrays": ["$_vqb_start_end", "$_vqb_children"]}

    return [
        {"$match": {(step.milestonesColumn): {"$in": [step.start, step.end]}}},
        {"$facet": facet},
        {"$project": {"_vqbFullArray": concatMongo}},
        {"$unwind": "$_vqbFullArray"},
        {"$replaceRoot": {"newRoot": "$_vqbFullArray"}},
        {
            "$sort": {
                "_vqbOrder": 1,
                ("LABEL_waterfall" if step.sortBy == "label" else step.valueColumn): 1
                if step.order == "asc"
                else -1,
            },
        },
        {"$project": {"_vqbOrder": 0}},
    ]
