from typing import Any, Literal

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
        "default": None,
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
        "default": None,
    },
}


def _translate_date(step: FromdateStep, month_dict: MongoStep) -> list[MongoStep]:
    concat_separators = _extract_separators_from_date_format(step.format)
    concat_elements = []
    for _, value in concat_separators.items():
        concat_elements.append(value["prefix"])
        concat_elements.append(value["name"])
        if value.get("suffix"):
            concat_elements.append(value["suffix"])
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
                    "$concat": concat_elements,
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


_DATE_TAGS_MAPPING = {"%d": "$_vqbTempDay", "%B": "$_vqbTempMonth", "%b": "$_vqbTempMonth", "%Y": "$_vqbTempYear"}


_DATE_TAGS = ["%d", "%b", "%B", "%Y"]


def _order_date_tag_from_format(date_format):
    ordered_tag_pos: list[tuple[int, str]] = []
    for tag in _DATE_TAGS:
        try:
            ordered_tag_pos.append((date_format.index(tag), tag))
        except ValueError:
            continue
    return sorted(ordered_tag_pos)


def _extract_separators_from_date_format(date_format: str) -> dict[int, Any]:
    index = 0
    ordered_tag_pos = _order_date_tag_from_format(date_format)
    tag_separators = {}
    for position, tag in ordered_tag_pos:
        tag_separators[index] = {"name": _DATE_TAGS_MAPPING[tag], "position": position}
        index += 1
    for i in range(0, len(ordered_tag_pos)):
        if i == 0:
            tag_separators[i]["prefix"] = date_format[: tag_separators[i]["position"]]
        else:
            tag_separators[i]["prefix"] = date_format[
                (tag_separators[i - 1]["position"] + 2) : tag_separators[i]["position"]
            ]
        if i == len(ordered_tag_pos) - 1:
            tag_separators[i]["suffix"] = date_format[(tag_separators[i]["position"] + 2) :]
    return tag_separators


def translate_fromdate(step: FromdateStep) -> list[MongoStep]:
    if "%b" in step.format:
        return _translate_date(step, _SMALL_MONTH_REPLACE)
    if "%B" in step.format:
        return _translate_date(step, _FULL_MONTH_REPLACE)
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
