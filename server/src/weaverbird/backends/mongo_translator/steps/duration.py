from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import DurationStep

# A mapping of multiplier to apply to convert milliseconds in days, hours, minutes or seconds
DURATION_MULTIPLIER_MAP = {
    "days": 24 * 60 * 60 * 1000,
    "hours": 60 * 60 * 1000,
    "minutes": 60 * 1000,
    "seconds": 1000,
}


def translate_duration(step: DurationStep) -> list[MongoStep]:
    return [
        {
            "$addFields": {
                step.new_column_name: {
                    "$divide": [
                        # a time difference between dates is returned in milliseconds by Mongo
                        {"$subtract": [f"${step.end_date_column}", f"${step.start_date_column}"]},
                        DURATION_MULTIPLIER_MAP[step.duration_in],
                    ],
                },
            },
        }
    ]
