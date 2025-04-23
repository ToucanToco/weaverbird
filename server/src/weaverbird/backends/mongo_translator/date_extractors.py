from weaverbird.backends.mongo_translator.steps.types import MongoStep


def truncate_date_to_day(expr: dict | str) -> MongoStep:
    return {
        "$dateTrunc": {
            "unit": "day",
            "date": expr,
        },
    }


def extract_first_day_of_year(column: str) -> MongoStep:
    return {
        "$dateFromParts": {"year": {"$year": f"${column}"}, "month": 1, "day": 1},
    }


def extract_first_day_of_month(column: str) -> MongoStep:
    return {
        "$dateFromParts": {
            "year": {"$year": f"${column}"},
            "month": {"$month": f"${column}"},
            "day": 1,
        },
    }


def extract_first_day_of_week(column: str) -> MongoStep:
    return truncate_date_to_day(
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


def extract_first_day_of_quarter(column: str) -> MongoStep:
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


def extract_first_day_of_iso_week(column: str) -> MongoStep:
    return truncate_date_to_day(
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


def extract_current_day(column: str) -> MongoStep:
    return truncate_date_to_day(f"${column}")
