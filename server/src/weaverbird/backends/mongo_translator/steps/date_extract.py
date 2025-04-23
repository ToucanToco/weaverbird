from weaverbird.backends.mongo_translator.date_extractors import (
    extract_current_day,
    extract_first_day_of_iso_week,
    extract_first_day_of_month,
    extract_first_day_of_quarter,
    extract_first_day_of_week,
    extract_first_day_of_year,
    truncate_date_to_day,
)
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import DateExtractStep


def _extract_quarter(step: DateExtractStep) -> MongoStep:
    return {
        "$switch": {
            "branches": [
                {"case": {"$lte": [{"$divide": [{"$month": f"${step.column}"}, 3]}, 1]}, "then": 1},
                {"case": {"$lte": [{"$divide": [{"$month": f"${step.column}"}, 3]}, 2]}, "then": 2},
                {"case": {"$lte": [{"$divide": [{"$month": f"${step.column}"}, 3]}, 3]}, "then": 3},
            ],
            "default": 4,
        },
    }


def _extract_first_day_of_year(step: DateExtractStep) -> MongoStep:
    return extract_first_day_of_year(step.column)


def _extract_first_day_of_month(step: DateExtractStep) -> MongoStep:
    return extract_first_day_of_month(step.column)


def _extract_first_day_of_week(step: DateExtractStep) -> MongoStep:
    return extract_first_day_of_week(step.column)


def _extract_first_day_of_quarter(step: DateExtractStep) -> MongoStep:
    return extract_first_day_of_quarter(step.column)


def _extract_first_day_of_iso_week(step: DateExtractStep) -> MongoStep:
    return extract_first_day_of_iso_week(step.column)


def _extract_current_day(step: DateExtractStep) -> MongoStep:
    return extract_current_day(step.column)


def _extract_previous_day(step: DateExtractStep) -> MongoStep:
    return truncate_date_to_day(
        {
            # We subtract to the target date 1 day in milliseconds
            "$subtract": [f"${step.column}", 24 * 60 * 60 * 1000],
        }
    )


def _extract_first_day_of_previous_year(step: DateExtractStep) -> MongoStep:
    return {
        "$dateFromParts": {
            "year": {"$subtract": [{"$year": f"${step.column}"}, 1]},
            "month": 1,
            "day": 1,
        },
    }


def _extract_first_day_of_previous_month(step: DateExtractStep) -> MongoStep:
    return {
        "$dateFromParts": {
            "year": {
                "$cond": [
                    {"$eq": [{"$month": f"${step.column}"}, 1]},
                    {"$subtract": [{"$year": f"${step.column}"}, 1]},
                    {"$year": f"${step.column}"},
                ],
            },
            "month": {
                "$cond": [
                    {"$eq": [{"$month": f"${step.column}"}, 1]},
                    12,
                    {"$subtract": [{"$month": f"${step.column}"}, 1]},
                ],
            },
            "day": 1,
        },
    }


def _extract_first_day_of_previous_week(step: DateExtractStep) -> MongoStep:
    return truncate_date_to_day(
        {
            # We subtract to the target date a number of days corresponding to (dayOfWeek - 1)
            "$subtract": [
                {"$subtract": [f"${step.column}", 7 * 24 * 60 * 60 * 1000]},
                {
                    "$multiply": [
                        {"$subtract": [{"$dayOfWeek": f"${step.column}"}, 1]},
                        24 * 60 * 60 * 1000,
                    ],
                },
            ],
        }
    )


def _extract_first_day_of_previous_quarter(step: DateExtractStep) -> MongoStep:
    return {
        "$dateFromParts": {
            "year": {
                "$cond": [
                    {"$lte": [{"$divide": [{"$month": f"${step.column}"}, 3]}, 1]},
                    {"$subtract": [{"$year": f"${step.column}"}, 1]},
                    {"$year": f"${step.column}"},
                ],
            },
            "month": {
                "$switch": {
                    "branches": [
                        {
                            "case": {"$lte": [{"$divide": [{"$month": f"${step.column}"}, 3]}, 1]},
                            "then": 10,
                        },
                        {
                            "case": {"$lte": [{"$divide": [{"$month": f"${step.column}"}, 3]}, 2]},
                            "then": 1,
                        },
                        {
                            "case": {"$lte": [{"$divide": [{"$month": f"${step.column}"}, 3]}, 3]},
                            "then": 4,
                        },
                    ],
                    "default": 7,
                },
            },
            "day": 1,
        },
    }


def _extract_first_day_of_previous_iso_week(step: DateExtractStep) -> MongoStep:
    return truncate_date_to_day(
        {
            # We subtract to the target date a number of days corresponding to (isoDayOfWeek - 1)
            "$subtract": [
                {"$subtract": [f"${step.column}", 7 * 24 * 60 * 60 * 1000]},
                {
                    "$multiply": [
                        {"$subtract": [{"$isoDayOfWeek": f"${step.column}"}, 1]},
                        24 * 60 * 60 * 1000,
                    ],
                },
            ],
        }
    )


def _extract_previous_year(step: DateExtractStep) -> MongoStep:
    return {
        "$subtract": [{"$year": f"${step.column}"}, 1],
    }


def _extract_previous_month(step: DateExtractStep) -> MongoStep:
    return {
        "$cond": [
            {"$eq": [{"$month": f"${step.column}"}, 1]},
            12,
            {"$subtract": [{"$month": f"${step.column}"}, 1]},
        ],
    }


def _extract_previous_week(step: DateExtractStep) -> MongoStep:
    return {
        # We subtract to the target date 7 days in milliseconds
        "$week": {"$subtract": [f"${step.column}", 7 * 24 * 60 * 60 * 1000]},
    }


def _extract_previous_quarter(step: DateExtractStep) -> MongoStep:
    return {
        "$switch": {
            "branches": [
                {"case": {"$lte": [{"$divide": [{"$month": f"${step.column}"}, 3]}, 1]}, "then": 4},
                {"case": {"$lte": [{"$divide": [{"$month": f"${step.column}"}, 3]}, 2]}, "then": 1},
                {"case": {"$lte": [{"$divide": [{"$month": f"${step.column}"}, 3]}, 3]}, "then": 2},
            ],
            "default": 3,
        },
    }


def _extract_previous_iso_week(step: DateExtractStep) -> MongoStep:
    return {
        # We subtract to the target date 7 days in milliseconds
        "$isoWeek": {"$subtract": [f"${step.column}", 7 * 24 * 60 * 60 * 1000]},
    }


_ADVANCED_DATE_EXTRACT_MAP = {
    "quarter": _extract_quarter,
    "firstDayOfYear": _extract_first_day_of_year,
    "firstDayOfMonth": _extract_first_day_of_month,
    "firstDayOfWeek": _extract_first_day_of_week,
    "firstDayOfQuarter": _extract_first_day_of_quarter,
    "firstDayOfIsoWeek": _extract_first_day_of_iso_week,
    "currentDay": _extract_current_day,
    "previousDay": _extract_previous_day,
    "firstDayOfPreviousYear": _extract_first_day_of_previous_year,
    "firstDayOfPreviousMonth": _extract_first_day_of_previous_month,
    "firstDayOfPreviousWeek": _extract_first_day_of_previous_week,
    "firstDayOfPreviousQuarter": _extract_first_day_of_previous_quarter,
    "firstDayOfPreviousIsoWeek": _extract_first_day_of_previous_iso_week,
    "previousYear": _extract_previous_year,
    "previousMonth": _extract_previous_month,
    "previousWeek": _extract_previous_week,
    "previousQuarter": _extract_previous_quarter,
    "previousIsoWeek": _extract_previous_iso_week,
}

_DATE_EXTRACT_MAP = {
    "year": "$year",
    "month": "$month",
    "day": "$dayOfMonth",
    "week": "$week",
    "dayOfYear": "$dayOfYear",
    "dayOfWeek": "$dayOfWeek",
    "isoYear": "$isoWeekYear",
    "isoWeek": "$isoWeek",
    "isoDayOfWeek": "$isoDayOfWeek",
    "hour": "$hour",
    "minutes": "$minute",
    "seconds": "$second",
    "milliseconds": "$millisecond",
}


def translate_date_extract(step: DateExtractStep) -> list[MongoStep]:
    new_columns = []
    add_fields = {}

    date_info: list
    # For retrocompatibility
    if step.operation:
        date_info = [step.operation] if step.operation else step.date_info
        new_columns = [step.new_column_name if step.new_column_name else f"{step.column}_{step.operation}"]
    else:
        date_info = step.date_info.copy()
        new_columns = step.new_columns.copy()

    for i, d in enumerate(date_info):
        if d in _ADVANCED_DATE_EXTRACT_MAP:
            add_fields[new_columns[i]] = _ADVANCED_DATE_EXTRACT_MAP[d](step)
        else:
            add_fields[new_columns[i]] = {
                _DATE_EXTRACT_MAP[d]: f"${step.column}",
            }

    return [{"$addFields": add_fields}]
