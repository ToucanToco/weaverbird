from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps.addmissingdates import AddMissingDatesStep, DatesGranularity


def _add_missing_dates_year(step: AddMissingDatesStep) -> list[MongoStep]:
    groups = step.groups or []
    # add missing dates by looping over the unique dates array and adding a given date
    # if it's not already present in the original dataset
    add_missing_years_as_dates: MongoStep = {
        "$map": {
            # loop over a sorted array of all years between min and max year
            "input": {"$range": ["$_vqbMinYear", {"$add": ["$_vqbMaxYear", 1]}]},
            # use a variable "currentYear" as cursor
            "as": "currentYear",
            # and apply the following expression to every "currentYear"
            "in": {
                "$let": {
                    # use a variable yearIndex that represents the index of the "currentYear"
                    # cursor in the original array
                    "vars": {
                        "yearIndex": {"$indexOfArray": ["$_vqbArray._vqbYear", "$$currentYear"]},
                    },
                    "in": {
                        "$cond": [
                            # if "currentYear" is found in the original array
                            {"$ne": ["$$yearIndex", -1]},
                            # just get the original document in the original array
                            {"$arrayElemAt": ["$_vqbArray", "$$yearIndex"]},
                            # else add a new document with the missing date (we convert the year back to a date object)
                            # and the group fields (every other field will be undefined)
                            {
                                **{col: f"$_id.{col}" for col in groups},
                                step.dates_column: {"$dateFromParts": {"year": "$$currentYear"}},
                            },
                        ],
                    },
                }
            },
        }
    }

    return [
        # Extract the year of the date in a new column
        {"$addFields": {"_vqbYear": {"$year": f"${step.dates_column}"}}},
        # Group by logic to create an array with all original documents, and get the
        # min and max date of all documents confounded
        {
            "$group": {
                "_id": {col: f"${col}" for col in groups} if groups else None,
                "_vqbArray": {"$push": "$$ROOT"},
                "_vqbMinYear": {"$min": "$_vqbYear"},
                "_vqbMaxYear": {"$max": "$_vqbYear"},
            },
        },
        # That at this stage that all the magic happens (cf. supra)
        {"$addFields": {"_vqbAllDates": add_missing_years_as_dates}},
    ]


def _generate_date_from_parts(mongo_date: str, granularity: DatesGranularity) -> MongoStep:
    date_from_parts = {"year": {"$year": mongo_date}}
    if granularity in ("day", "month"):
        date_from_parts["month"] = {"$month": mongo_date}
    if granularity == "day":
        date_from_parts["day"] = {"$dayOfMonth": mongo_date}

    return date_from_parts


def _add_missing_dates_day_or_month(step: AddMissingDatesStep) -> list[MongoStep]:
    groups = step.groups or []
    # Create a sorted array of all dates (in days) ranging from min to
    # max dates found in the whole dataset. At this stage for the
    # month granularity, we will get duplicate dates because we need
    # to first generate all days one by one to increment the calendar
    # safely, before converting every day of a given  month to the 1st
    # of this month (via the $dateFromPart expression). We take care
    # of making month dates unique in a '$reduce' stage explained
    # later
    all_days_range = {
        "$map": {
            # create a array of integers ranging from 0 to the number of days separating the min and max date
            "input": {"$range": [0, {"$add": ["$_vqbMinMaxDiffInDays", 1]}]},
            # use a cursor 'currentDurationInDays' that will loop over the array
            "as": "currentDurationInDays",
            # apply the following operations to every element of the array via the cursor 'currentDurationInDays'
            "in": {
                "$let": {
                    # create a variable 'currentDay' that will correspond to the day resulting from the addition of the
                    # duration 'currentDurationInDays' (converted back to milliseconds) to the min date.
                    "vars": {
                        "currentDay": {
                            "$add": [
                                "$_vqbMinDay",
                                {"$multiply": ["$$currentDurationInDays", 60 * 60 * 24 * 1000]},
                            ],
                        },
                    },
                    # use the variable in the following expression, in which we recreate a date which granularity will
                    # depend on the user-specified granularity
                    "in": {
                        "$dateFromParts": _generate_date_from_parts(
                            "$$currentDay", step.dates_granularity
                        ),
                    },
                },
            },
        },
    }

    # For the month granularity only, use a $reduce stage to reduce the allDaysRange
    # array into an array of unique days.
    unique_days_for_month_granularity = {
        "$reduce": {
            "input": all_days_range,
            "initialValue": [],
            "in": {
                "$cond": [
                    # if the date is not found in the reduced array
                    {"$eq": [{"$indexOfArray": ["$$value", "$$this"]}, -1]},
                    # then add the date to it
                    {"$concatArrays": ["$$value", ["$$this"]]},
                    # else add nothing to it
                    {"$concatArrays": ["$$value", []]},
                ],
            },
        },
    }

    # add missing dates by looping over the unique dates array and adding a given date
    # if it's not already present in the original dataset
    add_missing_dates = {
        "$map": {
            # loop over unique dates array
            "input": all_days_range
            if step.dates_granularity == "day"
            else unique_days_for_month_granularity,
            # use a variable "date" as cursor
            "as": "date",
            # and apply the following expression to every "date"
            "in": {
                "$let": {
                    # use a variable dateIndex that represents the index
                    # of the "date" cursor in the original array of documents
                    "vars": {"dateIndex": {"$indexOfArray": ["$_vqbArray._vqbDay", "$$date"]}},
                    "in": {
                        "$cond": [
                            # if "date" is found in the original array
                            {"$ne": ["$$dateIndex", -1]},
                            # just get the original document in the original array
                            {"$arrayElemAt": ["$_vqbArray", "$$dateIndex"]},
                            # else add a new document with the missing
                            # date and the group fieldds (every other
                            # field will be undefined)
                            {
                                **{col: f"$_id.{col}" for col in groups},
                                step.dates_column: "$$date",
                            },
                        ],
                    },
                },
            },
        },
    }

    return [
        {
            "$addFields": {
                "_vqbDay": {
                    "$dateFromParts": _generate_date_from_parts(
                        f"${step.dates_column}", step.dates_granularity
                    ),
                },
            },
        },
        # Group by logic to create an array with all original documents, and get the
        # min and max date of all documents confounded
        {
            "$group": {
                "_id": {col: f"${col}" for col in groups} if step.groups else None,
                # '_id': groups or None,
                "_vqbArray": {"$push": "$$ROOT"},
                "_vqbMinDay": {"$min": "$_vqbDay"},
                "_vqbMaxDay": {"$max": "$_vqbDay"},
            },
        },
        # Compute the time difference between the min and max date in days (the
        # subtraction between two dates in mongo gives a duration in milliseconds)
        {
            "$addFields": {
                "_vqbMinMaxDiffInDays": {
                    "$divide": [{"$subtract": ["$_vqbMaxDay", "$_vqbMinDay"]}, 60 * 60 * 24 * 1000],
                },
            },
        },
        # That at this stage that all the magic happens (cf. supra)
        {"$addFields": {"_vqbAllDates": add_missing_dates}},
    ]


def translate_addmissingdates(step: AddMissingDatesStep) -> list[MongoStep]:
    return (
        _add_missing_dates_year(step)
        if step.dates_granularity == "year"
        else _add_missing_dates_day_or_month(step)
    ) + [
        # Get back to 1 row per document
        {"$unwind": "$_vqbAllDates"},
        # Change the root to get back to the document granularity
        {"$replaceRoot": {"newRoot": "$_vqbAllDates"}},
        # Remove remaining temporary column
        {"$project": {"_vqbYear" if step.dates_granularity == "year" else "_vqbDay": 0}},
    ]
