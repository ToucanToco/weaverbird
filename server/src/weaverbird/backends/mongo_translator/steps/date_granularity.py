from weaverbird.backends.mongo_translator.date_extractors import (
    extract_current_day,
    extract_first_day_of_iso_week,
    extract_first_day_of_month,
    extract_first_day_of_quarter,
    extract_first_day_of_week,
    extract_first_day_of_year,
)
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import DateGranularityStep

_EXTRACT_MAP = {
    "year": extract_first_day_of_year,
    "month": extract_first_day_of_month,
    "week": extract_first_day_of_week,
    "quarter": extract_first_day_of_quarter,
    "isoWeek": extract_first_day_of_iso_week,
    "day": extract_current_day,
}


def translate_date_granularity(step: DateGranularityStep) -> list[MongoStep]:
    column_name = step.new_column if step.new_column is not None else step.column
    return [{"$addFields": {column_name: _EXTRACT_MAP[step.granularity](step.column)}}]
