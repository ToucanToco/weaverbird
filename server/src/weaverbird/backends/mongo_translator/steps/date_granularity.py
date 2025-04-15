from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import DateGranularityStep


def _truncate_date_to_day(expr: dict | str) -> MongoStep:
    return {
        "$dateTrunc": {
            "unit": "day",
            "date": expr,
        },
    }


def _extract_quarter(column: str) -> MongoStep:
    return {
        "$switch": {
            "branches": [
                {"case": {"$lte": [{"$divide": [{"$month": f"${column}"}, 3]}, 1]}, "then": 1},
                {"case": {"$lte": [{"$divide": [{"$month": f"${column}"}, 3]}, 2]}, "then": 2},
                {"case": {"$lte": [{"$divide": [{"$month": f"${column}"}, 3]}, 3]}, "then": 3},
            ],
            "default": 4,
        },
    }


def _extract_first_day_of_year(column: str) -> MongoStep:
    return {
        "$dateFromParts": {"year": {"$year": f"${column}"}, "month": 1, "day": 1},
    }


def _extract_first_day_of_month(column: str) -> MongoStep:
    return {
        "$dateFromParts": {
            "year": {"$year": f"${column}"},
            "month": {"$month": f"${column}"},
            "day": 1,
        },
    }


def _extract_first_day_of_week(column: str) -> MongoStep:
    return _truncate_date_to_day(
        {
            # We subtract to the target date a number of days corresponding to (dayOfWeek - 1)
            "$subtract": [
                f"${column}",
                {
                    "$multiply": [
                        {"$subtract": [{"$dayOfWeek": f"${column}"}, 1]},
                        24 * 60 * 60 * 1000,
                    ],
                },
            ],
        }
    )


def _extract_first_day_of_quarter(column: str) -> MongoStep:
    return {
        "$dateFromParts": {
            "year": {"$year": f"${column}"},
            "month": {
                "$switch": {
                    "branches": [
                        {
                            "case": {"$lte": [{"$divide": [{"$month": f"${column}"}, 3]}, 1]},
                            "then": 1,
                        },
                        {
                            "case": {"$lte": [{"$divide": [{"$month": f"${column}"}, 3]}, 2]},
                            "then": 4,
                        },
                        {
                            "case": {"$lte": [{"$divide": [{"$month": f"${column}"}, 3]}, 3]},
                            "then": 7,
                        },
                    ],
                    "default": 10,
                },
            },
            "day": 1,
        },
    }


def _extract_first_day_of_iso_week(column: str) -> MongoStep:
    return _truncate_date_to_day(
        {
            # We subtract to the target date a number of days corresponding to (isoDayOfWeek - 1)
            "$subtract": [
                f"${column}",
                {
                    "$multiply": [
                        {"$subtract": [{"$isoDayOfWeek": f"${column}"}, 1]},
                        24 * 60 * 60 * 1000,
                    ],
                },
            ],
        }
    )


def _extract_current_day(column: str) -> MongoStep:
    return _truncate_date_to_day(f"${column}")


def _extract_previous_day(column: str) -> MongoStep:
    return _truncate_date_to_day(
        {
            # We subtract to the target date 1 day in milliseconds
            "$subtract": [f"${column}", 24 * 60 * 60 * 1000],
        }
    )


def _extract_first_day_of_previous_year(column: str) -> MongoStep:
    return {
        "$dateFromParts": {
            "year": {"$subtract": [{"$year": f"${column}"}, 1]},
            "month": 1,
            "day": 1,
        },
    }


def _extract_first_day_of_previous_month(column: str) -> MongoStep:
    return {
        "$dateFromParts": {
            "year": {
                "$cond": [
                    {"$eq": [{"$month": f"${column}"}, 1]},
                    {"$subtract": [{"$year": f"${column}"}, 1]},
                    {"$year": f"${column}"},
                ],
            },
            "month": {
                "$cond": [
                    {"$eq": [{"$month": f"${column}"}, 1]},
                    12,
                    {"$subtract": [{"$month": f"${column}"}, 1]},
                ],
            },
            "day": 1,
        },
    }


def _extract_first_day_of_previous_week(column: str) -> MongoStep:
    return _truncate_date_to_day(
        {
            # We subtract to the target date a number of days corresponding to (dayOfWeek - 1)
            "$subtract": [
                {"$subtract": [f"${column}", 7 * 24 * 60 * 60 * 1000]},
                {
                    "$multiply": [
                        {"$subtract": [{"$dayOfWeek": f"${column}"}, 1]},
                        24 * 60 * 60 * 1000,
                    ],
                },
            ],
        }
    )


def _extract_first_day_of_previous_quarter(column: str) -> MongoStep:
    return {
        "$dateFromParts": {
            "year": {
                "$cond": [
                    {"$lte": [{"$divide": [{"$month": f"${column}"}, 3]}, 1]},
                    {"$subtract": [{"$year": f"${column}"}, 1]},
                    {"$year": f"${column}"},
                ],
            },
            "month": {
                "$switch": {
                    "branches": [
                        {
                            "case": {"$lte": [{"$divide": [{"$month": f"${column}"}, 3]}, 1]},
                            "then": 10,
                        },
                        {
                            "case": {"$lte": [{"$divide": [{"$month": f"${column}"}, 3]}, 2]},
                            "then": 1,
                        },
                        {
                            "case": {"$lte": [{"$divide": [{"$month": f"${column}"}, 3]}, 3]},
                            "then": 4,
                        },
                    ],
                    "default": 7,
                },
            },
            "day": 1,
        },
    }


def _extract_first_day_of_previous_iso_week(column: str) -> MongoStep:
    return _truncate_date_to_day(
        {
            # We subtract to the target date a number of days corresponding to (isoDayOfWeek - 1)
            "$subtract": [
                {"$subtract": [f"${column}", 7 * 24 * 60 * 60 * 1000]},
                {
                    "$multiply": [
                        {"$subtract": [{"$isoDayOfWeek": f"${column}"}, 1]},
                        24 * 60 * 60 * 1000,
                    ],
                },
            ],
        }
    )


def _extract_previous_year(column: str) -> MongoStep:
    return {
        "$subtract": [{"$year": f"${column}"}, 1],
    }


def _extract_previous_month(column: str) -> MongoStep:
    return {
        "$cond": [
            {"$eq": [{"$month": f"${column}"}, 1]},
            12,
            {"$subtract": [{"$month": f"${column}"}, 1]},
        ],
    }


def _extract_previous_week(column: str) -> MongoStep:
    return {
        # We subtract to the target date 7 days in milliseconds
        "$week": {"$subtract": [f"${column}", 7 * 24 * 60 * 60 * 1000]},
    }


def _extract_previous_quarter(column: str) -> MongoStep:
    return {
        "$switch": {
            "branches": [
                {"case": {"$lte": [{"$divide": [{"$month": f"${column}"}, 3]}, 1]}, "then": 4},
                {"case": {"$lte": [{"$divide": [{"$month": f"${column}"}, 3]}, 2]}, "then": 1},
                {"case": {"$lte": [{"$divide": [{"$month": f"${column}"}, 3]}, 3]}, "then": 2},
            ],
            "default": 3,
        },
    }


def _extract_previous_iso_week(column: str) -> MongoStep:
    return {
        # We subtract to the target date 7 days in milliseconds
        "$isoWeek": {"$subtract": [f"${column}", 7 * 24 * 60 * 60 * 1000]},
    }


_EXTRACT_MAP = {
    "year": _extract_first_day_of_year,
    "month": _extract_first_day_of_month,
    "week": _extract_first_day_of_week,
    "quarter": _extract_first_day_of_quarter,
    "isoWeek": _extract_first_day_of_iso_week,
    "day": _extract_current_day,
}


def translate_date_granularity(step: DateGranularityStep) -> list[MongoStep]:
    column_name = step.new_column if step.new_column is not None else step.column
    return [{"$addFields": {column_name: _EXTRACT_MAP[step.granularity](step.column)}}]
