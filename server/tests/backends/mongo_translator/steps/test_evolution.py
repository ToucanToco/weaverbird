from weaverbird.backends.mongo_translator.steps.evolution import translate_evolution
from weaverbird.pipeline.steps.evolution import EvolutionStep


def test_translate_evolution() -> None:
    step = EvolutionStep(
        dateCol="foo",
        valueCol="bar",
        evolutionFormat="abs",
        evolutionType="vsLastDay",
        indexColumns=["a", "b", "c"],
    )

    assert translate_evolution(step) == [
        {
            "$addFields": {
                "_VQB_DATE_PREV": {
                    "$dateSubtract": {"amount": 1, "startDate": "$foo", "unit": "week"}
                }
            }
        },
        {
            "$facet": {
                "_VQB_COPIES_ARRAY": [
                    {"$group": {"_VQB_ALL_DOCS": {"$push": "$$ROOT"}, "_id": None}}
                ],
                "_VQB_ORIGINALS": [{"$project": {"_id": 0}}],
            }
        },
        {"$unwind": "$_VQB_ORIGINALS"},
        {
            "$project": {
                "_VQB_ORIGINALS": {
                    "$mergeObjects": [
                        "$_VQB_ORIGINALS",
                        {"$arrayElemAt": ["$_VQB_COPIES_ARRAY", 0]},
                    ]
                }
            }
        },
        {"$replaceRoot": {"newRoot": "$_VQB_ORIGINALS"}},
        {
            "$addFields": {
                "_VQB_ALL_DOCS": {
                    "$filter": {
                        "as": "item",
                        "cond": {
                            "$and": [
                                {"$eq": ["$_VQB_DATE_PREV", "$$item.foo"]},
                                {"$eq": ["$a", "$$item.a"]},
                                {"$eq": ["$b", "$$item.b"]},
                                {"$eq": ["$c", "$$item.c"]},
                            ]
                        },
                        "input": "$_VQB_ALL_DOCS",
                    }
                }
            }
        },
        {
            "$addFields": {
                "_VQB_VALUE_PREV": {
                    "$cond": [
                        {"$gt": [{"$size": "$_VQB_ALL_DOCS.bar"}, 1]},
                        "Error",
                        {"$arrayElemAt": ["$_VQB_ALL_DOCS.bar", 0]},
                    ]
                }
            }
        },
        {
            "$addFields": {
                "bar_EVOL_ABS": {
                    "$cond": [
                        {"$eq": ["$_VQB_VALUE_PREV", "Error"]},
                        "Error: More than one previous "
                        "date found for the specified "
                        "index columns",
                        {"$subtract": ["$bar", "$_VQB_VALUE_PREV"]},
                    ]
                }
            }
        },
        {"$project": {"_VQB_ALL_DOCS": 0, "_VQB_DATE_PREV": 0, "_VQB_VALUE_PREV": 0}},
    ]
