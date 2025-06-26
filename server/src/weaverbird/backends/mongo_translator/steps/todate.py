from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import ToDateStep

_VQB_TEMP_DAY = "_vqbTempDay"
_VQB_TEMP_MONTH = "_vqbTempMonth"
_VQB_TEMP_YEAR = "_vqbTempYear"
_VQB_TEMP_ARRAY = "_vqbTempArray"
_VQB_TEMP_DATE = "_vqbTempDate"


def translate_todate(step: ToDateStep) -> list[MongoStep]:
    date_format = step.format

    col_as_string = {"$toString": f"${step.column}"}

    steps: list[dict] = []
    should_guess_century = False

    if date_format:
        # % B and %b should be equivalent
        date_format = date_format.replace("%B", "%b")

        if "%y" in date_format:
            date_format = date_format.replace("%y", "%Y")
            should_guess_century = True

    if not date_format:
        # Mongo will try to guess the date format
        steps = [
            {
                "$addFields": {
                    step.column: {
                        "$dateFromString": {
                            "dateString": col_as_string,
                            # However, we give it a second chance to find formats it can't guess natively
                            "onError": {
                                "$cond": [
                                    # Integer values may be either years or timestamps
                                    {"$in": [{"$type": f"${step.column}"}, ["int", "long"]]},
                                    {
                                        "$cond": [
                                            # We decide that values lower than 10_000 will be interpreted as years...
                                            {"$lt": [f"${step.column}", 10_000]},
                                            {
                                                "$dateFromString": {
                                                    "dateString": {"$concat": [col_as_string, "-01-01"]},
                                                    "format": "%Y-%m-%d",
                                                    "onError": {"$literal": None},
                                                }
                                            },
                                            # ...and greater values will be interpreted as timestamps
                                            {
                                                "$convert": {
                                                    "input": f"${step.column}",
                                                    "to": "date",
                                                    "onError": {"$literal": None},
                                                }
                                            },
                                        ]
                                    },
                                    # otherwise, try to interpret as years
                                    {
                                        "$dateFromString": {
                                            "dateString": {"$concat": [col_as_string, "-01-01"]},
                                            "format": "%Y-%m-%d",
                                            # and give up if it doesn't work
                                            "onError": {"$literal": None},
                                        }
                                    },
                                ]
                            },
                        }
                    }
                }
            }
        ]

    # Mongo doesn't handle months names (%b and %B), so we replace them by numbers before converting
    # All these could probably be factorized to make it easier to read!
    elif date_format == "%d %b %Y":
        steps = [
            {"$addFields": {_VQB_TEMP_ARRAY: {"$split": [col_as_string, " "]}}},
            _extract_date_parts_to_temp_fields(2, 1, 0),
            MONTH_REPLACEMENT_STEP,
            _concat_fields_to_date(
                step.column,
                [
                    f"${_VQB_TEMP_DAY}",
                    "-",
                    f"${_VQB_TEMP_MONTH}",
                    "-",
                    f"${_VQB_TEMP_YEAR}",
                ],
                "%d-%m-%Y",
            ),
            _clean_temp_fields(),
        ]

    elif date_format == "%d-%b-%Y":
        steps = [
            {"$addFields": {_VQB_TEMP_ARRAY: {"$split": [col_as_string, "-"]}}},
            _extract_date_parts_to_temp_fields(2, 1, 0),
            MONTH_REPLACEMENT_STEP,
            _concat_fields_to_date(
                step.column,
                [
                    f"${_VQB_TEMP_DAY}",
                    "-",
                    f"${_VQB_TEMP_MONTH}",
                    "-",
                    f"${_VQB_TEMP_YEAR}",
                ],
                "%d-%m-%Y",
            ),
            _clean_temp_fields(),
        ]

    elif date_format == "%b %Y":
        steps = [
            {"$addFields": {_VQB_TEMP_ARRAY: {"$split": [col_as_string, " "]}}},
            _extract_date_parts_to_temp_fields(1, 0),
            MONTH_REPLACEMENT_STEP,
            _concat_fields_to_date(step.column, ["01-", f"${_VQB_TEMP_MONTH}", "-", f"${_VQB_TEMP_YEAR}"], "%d-%m-%Y"),
            _clean_temp_fields(),
        ]

    elif date_format == "%b-%Y":
        steps = [
            {"$addFields": {_VQB_TEMP_ARRAY: {"$split": [col_as_string, "-"]}}},
            _extract_date_parts_to_temp_fields(1, 0),
            MONTH_REPLACEMENT_STEP,
            _concat_fields_to_date(step.column, ["01-", f"${_VQB_TEMP_MONTH}", "-", f"${_VQB_TEMP_YEAR}"], "%d-%m-%Y"),
            _clean_temp_fields(),
        ]

    # Mongo does not support dates where some parts of the date are missing
    elif date_format == "%Y-%m":
        steps = [
            _concat_fields_to_date(step.column, [col_as_string, "-01"], "%Y-%m-%d"),
        ]

    elif date_format == "%Y/%m":
        steps = [
            _concat_fields_to_date(step.column, ["/01", col_as_string], "%Y/%m/%d"),
        ]

    elif date_format == "%m-%Y":
        steps = [
            _concat_fields_to_date(step.column, ["01-", col_as_string], "%d-%m-%Y"),
        ]

    elif date_format == "%m/%Y":
        steps = [
            _concat_fields_to_date(step.column, ["01/", col_as_string], "%d/%m/%Y"),
        ]

    elif date_format == "%Y":
        steps = [
            _concat_fields_to_date(step.column, [col_as_string, "-01-01"], "%Y-%m-%d"),
        ]

    else:
        steps = [
            {
                "$addFields": {
                    step.column: {
                        "$dateFromString": {
                            "dateString": col_as_string,
                            "format": date_format,
                            "onError": {"$literal": None},
                        }
                    }
                }
            }
        ]

    # When year is stored as two-digits, it should be guessed like pandas %y:
    # 00-68 -> 2000-2068 and 69-99 -> 1969-1999
    if should_guess_century:
        steps.append(
            {
                "$addFields": {
                    step.column: {
                        "$dateAdd": {
                            "startDate": f"${step.column}",
                            "unit": "year",
                            "amount": {
                                "$cond": {
                                    "if": {"$gt": [{"$year": f"${step.column}"}, 68]},
                                    "then": 1900,
                                    "else": 2000,
                                }
                            },
                        }
                    }
                }
            }
        )

    return steps


MONTH_NUMBER_TO_NAMES = {
    "01": ["jan", "jan.", "january", "janv", "janv.", "janvier"],
    "02": ["feb", "feb.", "february", "fév", "fev", "févr.", "fevr.", "février"],
    "03": ["mar", "mar.", "march", "mars"],
    "04": ["apr", "apr.", "april", "avr", "avr.", "avril"],
    "05": ["may", "mai"],
    "06": ["june", "jun.", "june", "juin"],
    "07": ["jul", "jul.", "july", "juil", "juil.", "juillet"],
    "08": ["aug", "aug.", "august", "août", "aout"],
    "09": ["sep", "sep.", "september", "sept", "sept.", "septembre"],
    "10": ["oct", "oct.", "october", "octobre"],
    "11": ["nov", "nov.", "november", "novembre"],
    "12": ["dec", "dec.", "december", "déc", "déc.", "décembre"],
}


MONTH_REPLACEMENT_STEP: MongoStep = {
    "$addFields": {
        _VQB_TEMP_MONTH: {
            "$switch": {
                "branches": [
                    {
                        "case": {"$in": [f"${_VQB_TEMP_MONTH}", month_names]},
                        "then": month_number,
                    }
                    for month_number, month_names in MONTH_NUMBER_TO_NAMES.items()
                ],
                "default": None,
            }
        }
    }
}


def _extract_date_parts_to_temp_fields(
    year_position: int, month_position: int | None = None, day_position: int | None = None
) -> MongoStep:
    date_parts_temp_fields: MongoStep = {
        _VQB_TEMP_YEAR: {"$arrayElemAt": [f"${_VQB_TEMP_ARRAY}", year_position]},
    }

    if month_position is not None:
        date_parts_temp_fields[_VQB_TEMP_MONTH] = {
            "$toLower": {"$arrayElemAt": [f"${_VQB_TEMP_ARRAY}", month_position]}
        }

    if day_position is not None:
        date_parts_temp_fields[_VQB_TEMP_DAY] = {"$arrayElemAt": [f"${_VQB_TEMP_ARRAY}", day_position]}

    return {
        "$addFields": date_parts_temp_fields,
    }


def _clean_temp_fields():
    return {
        "$project": {
            _VQB_TEMP_ARRAY: 0,
            _VQB_TEMP_DAY: 0,
            _VQB_TEMP_MONTH: 0,
            _VQB_TEMP_YEAR: 0,
            _VQB_TEMP_DATE: 0,
        }
    }


def _concat_fields_to_date(target_col: str, fields: list[str | dict], format: str):
    return {
        "$addFields": {
            target_col: {
                "$dateFromString": {
                    "dateString": {
                        "$concat": fields,
                    },
                    "format": format,
                },
            },
        },
    }
