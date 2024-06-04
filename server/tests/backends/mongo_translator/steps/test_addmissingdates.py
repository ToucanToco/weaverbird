from weaverbird.backends.mongo_translator.steps import translate_addmissingdates
from weaverbird.pipeline.steps import AddMissingDatesStep


def test_add_missing_date_generation():
    assert translate_addmissingdates(
        AddMissingDatesStep(name="addmissingdates", dates_column="Year", dates_granularity="month", groups=[])
    ) == [
        {"$addFields": {"_vqbDay": {"$dateFromParts": {"year": {"$year": "$Year"}, "month": {"$month": "$Year"}}}}},
        {
            "$group": {
                "_id": None,
                "_vqbArray": {"$push": "$$ROOT"},
                "_vqbMinDay": {"$min": "$_vqbDay"},
                "_vqbMaxDay": {"$max": "$_vqbDay"},
            }
        },
        {
            "$addFields": {
                "_vqbMinMaxDiffInDays": {"$divide": [{"$subtract": ["$_vqbMaxDay", "$_vqbMinDay"]}, 86400000]}
            }
        },
        {
            "$addFields": {
                "_vqbAllDates": {
                    "$let": {
                        "vars": {
                            "currentColumns": {
                                "$arrayToObject": {
                                    "$map": {
                                        "input": {"$objectToArray": {"$arrayElemAt": ["$_vqbArray", 0]}},
                                        "as": "field",
                                        "in": {"k": "$$field.k", "v": None},
                                    }
                                }
                            }
                        },
                        "in": {
                            "$map": {
                                "input": {
                                    "$reduce": {
                                        "input": {
                                            "$map": {
                                                "input": {"$range": [0, {"$add": ["$_vqbMinMaxDiffInDays", 1]}]},
                                                "as": "currentDurationInDays",
                                                "in": {
                                                    "$let": {
                                                        "vars": {
                                                            "currentDay": {
                                                                "$add": [
                                                                    "$_vqbMinDay",
                                                                    {
                                                                        "$multiply": [
                                                                            "$$currentDurationInDays",
                                                                            86400000,
                                                                        ]
                                                                    },
                                                                ]
                                                            }
                                                        },
                                                        "in": {
                                                            "$dateFromParts": {
                                                                "year": {"$year": "$$currentDay"},
                                                                "month": {"$month": "$$currentDay"},
                                                            }
                                                        },
                                                    }
                                                },
                                            }
                                        },
                                        "initialValue": [],
                                        "in": {
                                            "$cond": [
                                                {"$eq": [{"$indexOfArray": ["$$value", "$$this"]}, -1]},
                                                {"$concatArrays": ["$$value", ["$$this"]]},
                                                {"$concatArrays": ["$$value", []]},
                                            ]
                                        },
                                    }
                                },
                                "as": "date",
                                "in": {
                                    "$let": {
                                        "vars": {"dateIndex": {"$indexOfArray": ["$_vqbArray._vqbDay", "$$date"]}},
                                        "in": {
                                            "$cond": [
                                                {"$ne": ["$$dateIndex", -1]},
                                                {"$arrayElemAt": ["$_vqbArray", "$$dateIndex"]},
                                                {"$mergeObjects": ["$$currentColumns", {"Year": "$$date"}]},
                                            ]
                                        },
                                    }
                                },
                            }
                        },
                    }
                }
            }
        },
        {"$unwind": "$_vqbAllDates"},
        {"$replaceRoot": {"newRoot": "$_vqbAllDates"}},
        {"$project": {"_vqbDay": 0}},
    ]
