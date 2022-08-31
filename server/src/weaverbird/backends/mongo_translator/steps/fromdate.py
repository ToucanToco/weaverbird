from typing import Literal

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps.fromdate import FromdateStep

MonthReplacement = dict[Literal["$switch"], dict[Literal["branches"], list[MongoStep]]]

_SMALL_MONTH_REPLACE = {
    "$switch": {
        "branches": [
            {"case": {"$eq": ["$_vqbTempMonth", "01"]}, "then": "Jan"},
            {"case": {"$eq": ["$_vqbTempMonth", "02"]}, "then": "Feb"},
            {"case": {"$eq": ["$_vqbTempMonth", "03"]}, "then": "Mar"},
            {"case": {"$eq": ["$_vqbTempMonth", "04"]}, "then": "Apr"},
            {"case": {"$eq": ["$_vqbTempMonth", "05"]}, "then": "May"},
            {"case": {"$eq": ["$_vqbTempMonth", "06"]}, "then": "Jun"},
            {"case": {"$eq": ["$_vqbTempMonth", "07"]}, "then": "Jul"},
            {"case": {"$eq": ["$_vqbTempMonth", "08"]}, "then": "Aug"},
            {"case": {"$eq": ["$_vqbTempMonth", "09"]}, "then": "Sep"},
            {"case": {"$eq": ["$_vqbTempMonth", "10"]}, "then": "Oct"},
            {"case": {"$eq": ["$_vqbTempMonth", "11"]}, "then": "Nov"},
            {"case": {"$eq": ["$_vqbTempMonth", "12"]}, "then": "Dec"},
        ],
    },
}

_FULL_MONTH_REPLACE = {
    "$switch": {
        "branches": [
            {"case": {"$eq": ["$_vqbTempMonth", "01"]}, "then": "January"},
            {"case": {"$eq": ["$_vqbTempMonth", "02"]}, "then": "February"},
            {"case": {"$eq": ["$_vqbTempMonth", "03"]}, "then": "March"},
            {"case": {"$eq": ["$_vqbTempMonth", "04"]}, "then": "April"},
            {"case": {"$eq": ["$_vqbTempMonth", "05"]}, "then": "May"},
            {"case": {"$eq": ["$_vqbTempMonth", "06"]}, "then": "June"},
            {"case": {"$eq": ["$_vqbTempMonth", "07"]}, "then": "July"},
            {"case": {"$eq": ["$_vqbTempMonth", "08"]}, "then": "August"},
            {"case": {"$eq": ["$_vqbTempMonth", "09"]}, "then": "September"},
            {"case": {"$eq": ["$_vqbTempMonth", "10"]}, "then": "October"},
            {"case": {"$eq": ["$_vqbTempMonth", "11"]}, "then": "November"},
            {"case": {"$eq": ["$_vqbTempMonth", "12"]}, "then": "December"},
        ],
    },
}


def _translate_month_year(
    step: FromdateStep, concat_separator: Literal[" ", "-"], month_dict: MongoStep
) -> list[MongoStep]:
    return [
        {
            "$addFields": {
                step.column: {
                    "$dateToString": {"date": f"${step.column}", "format": "%m-%Y"},
                },
            },
        },
        {"$addFields": {"_vqbTempArray": {"$split": [f"${step.column}", "-"]}}},
        {
            "$addFields": {
                "_vqbTempMonth": {"$arrayElemAt": ["$_vqbTempArray", 0]},
                "_vqbTempYear": {"$arrayElemAt": ["$_vqbTempArray", 1]},
            },
        },
        {
            "$addFields": {"_vqbTempMonth": month_dict},
        },
        {
            "$addFields": {
                step.column: {
                    "$concat": ["$_vqbTempMonth", concat_separator, "$_vqbTempYear"],
                },
            },
        },
        {"$project": {"_vqbTempArray": 0, "_vqbTempMonth": 0, "_vqbTempYear": 0}},
    ]


def _translate_day_month_year(
    step: FromdateStep, concat_separator: Literal[" ", "-"], month_dict: MongoStep
) -> list[MongoStep]:
    return [
        {
            "$addFields": {
                step.column: {
                    "$dateToString": {"date": f"${step.column}", "format": "%d-%m-%Y"},
                },
            },
        },
        {"$addFields": {"_vqbTempArray": {"$split": [f"${step.column}", "-"]}}},
        {
            "$addFields": {
                "_vqbTempDay": {"$arrayElemAt": ["$_vqbTempArray", 0]},
                "_vqbTempMonth": {"$arrayElemAt": ["$_vqbTempArray", 1]},
                "_vqbTempYear": {"$arrayElemAt": ["$_vqbTempArray", 2]},
            },
        },
        {
            "$addFields": {"_vqbTempMonth": month_dict},
        },
        {
            "$addFields": {
                step.column: {
                    "$concat": [
                        "$_vqbTempDay",
                        concat_separator,
                        "$_vqbTempMonth",
                        concat_separator,
                        "$_vqbTempYear",
                    ],
                },
            },
        },
        {
            "$project": {
                "_vqbTempArray": 0,
                "_vqbTempDay": 0,
                "_vqbTempMonth": 0,
                "_vqbTempYear": 0,
            }
        },
    ]


def translate_fromdate(step: FromdateStep) -> list[MongoStep]:
    if step.format == "%d %b %Y":
        return _translate_day_month_year(step, " ", _SMALL_MONTH_REPLACE)
    if step.format == "%d-%b-%Y":
        return _translate_day_month_year(step, "-", _SMALL_MONTH_REPLACE)
    if step.format == "%d %B %Y":
        return _translate_day_month_year(step, " ", _FULL_MONTH_REPLACE)
    if step.format == "%b %Y":
        return _translate_month_year(step, " ", _SMALL_MONTH_REPLACE)
    if step.format == "%b-%Y":
        return _translate_month_year(step, "-", _SMALL_MONTH_REPLACE)
    if step.format == "%B %Y":
        return _translate_month_year(step, " ", _FULL_MONTH_REPLACE)
    else:
        return [
            {
                "$addFields": {
                    step.column: {
                        "$dateToString": {"date": f"${step.column}", "format": step.format},
                    },
                },
            },
        ]
