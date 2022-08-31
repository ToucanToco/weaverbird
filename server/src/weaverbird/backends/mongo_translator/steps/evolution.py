from typing import Any

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import EvolutionStep


def translate_evolution(step: EvolutionStep) -> list[MongoStep]:
    new_column = (
        step.new_column
        if step.new_column
        else f"{step.value_col}_EVOL_{step.evolution_format.upper()}"
    )
    error_msg = "Error: More than one previous date found for the specified index columns"
    add_field_result: dict[str, Any] = {}

    if step.evolution_format == "abs":
        add_field_result[new_column] = {
            "$cond": [
                {"$eq": ["$_VQB_VALUE_PREV", "Error"]},
                error_msg,
                {"$subtract": [f"${step.value_col}", "$_VQB_VALUE_PREV"]},
            ],
        }
    else:
        add_field_result[new_column] = {
            "$switch": {
                "branches": [
                    {"case": {"$eq": ["$_VQB_VALUE_PREV", "Error"]}, "then": error_msg},
                    {"case": {"$eq": ["$_VQB_VALUE_PREV", 0]}, "then": None},
                ],
                "default": {
                    "$divide": [
                        {"$subtract": [f"${step.value_col}", "$_VQB_VALUE_PREV"]},
                        "$_VQB_VALUE_PREV",
                    ],
                },
            },
        }

    if step.evolution_type == "vsLastYear":
        unit = "year"
    elif step.evolution_type == "vsLastMonth":
        unit = "month"
    else:
        unit = "week"

    return [
        {
            "$addFields": {
                "_VQB_DATE_PREV": {
                    # NOTE: This requires mongo>=5.0
                    "$dateSubtract": {"startDate": f"${step.date_col}", "unit": unit, "amount": 1}
                }
            }
        },
        {
            "$facet": {
                "_VQB_ORIGINALS": [{"$project": {"_id": 0}}],
                "_VQB_COPIES_ARRAY": [
                    {"$group": {"_id": None, "_VQB_ALL_DOCS": {"$push": "$$ROOT"}}}
                ],
            },
        },
        {"$unwind": "$_VQB_ORIGINALS"},
        {
            "$project": {
                "_VQB_ORIGINALS": {
                    "$mergeObjects": [
                        "$_VQB_ORIGINALS",
                        {"$arrayElemAt": ["$_VQB_COPIES_ARRAY", 0]},
                    ],
                },
            },
        },
        {"$replaceRoot": {"newRoot": "$_VQB_ORIGINALS"}},
        {
            "$addFields": {
                "_VQB_ALL_DOCS": {
                    "$filter": {
                        "input": "$_VQB_ALL_DOCS",
                        "as": "item",
                        "cond": {
                            "$and": [
                                {"$eq": ["$_VQB_DATE_PREV", f"$$item.{step.date_col}"]},
                                {"$eq": [f"${col}", f"$$item.{col}"] for col in step.index_columns},
                            ],
                        },
                    },
                },
            },
        },
        {
            "$addFields": {
                "_VQB_VALUE_PREV": {
                    "$cond": [
                        {"$gt": [{"$size": f"$_VQB_ALL_DOCS.{step.value_col}"}, 1]},
                        "Error",
                        {"$arrayElemAt": [f"$_VQB_ALL_DOCS.{step.value_col}", 0]},
                    ],
                },
            },
        },
        {"$addFields": add_field_result},
        {
            "$project": {
                "_VQB_ALL_DOCS": 0,
                "_VQB_DATE_PREV": 0,
                "_VQB_VALUE_PREV": 0,
            },
        },
    ]
