from pandas import DataFrame, to_datetime

from weaverbird.backends.pandas_executor.date_extractors import (
    extract_current_day_date,
    extract_first_day_of_iso_week,
    extract_first_day_of_month,
    extract_first_day_of_quarter,
    extract_first_day_of_week,
    extract_first_day_of_year,
)
from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import DateGranularityStep


def execute_date_granularity(
    step: DateGranularityStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    granularity = step.granularity
    new_column_name = step.new_column if step.new_column is not None else step.column

    series_dt = to_datetime(df[step.column], utc=True)

    if granularity == "year":
        result = extract_first_day_of_year(series_dt)
    elif granularity == "month":
        result = extract_first_day_of_month(series_dt)
    elif granularity == "week":
        result = extract_first_day_of_week(series_dt)
    elif granularity == "quarter":
        result = extract_first_day_of_quarter(series_dt)
    elif granularity == "isoWeek":
        result = extract_first_day_of_iso_week(series_dt)
    elif granularity == "day":
        result = extract_current_day_date(series_dt)
    else:
        return df

    return df.assign(**{new_column_name: result})
