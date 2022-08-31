import numpy as np
import pandas as pd
from pandas import Series

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import AddMissingDatesStep

# cf. https://pandas.pydata.org/pandas-docs/stable/user_guide/timeseries.html#offset-aliases
_FREQUENCIES = {"day": "D", "week": "W", "month": "M", "year": "Y"}


def at_begin_period(timestamps: Series, dates_granularity: str):
    return timestamps.dt.to_period(_FREQUENCIES[dates_granularity]).dt.start_time


def execute_addmissingdates(
    step: AddMissingDatesStep,
    df: pd.DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> pd.DataFrame:
    if len(step.groups) > 0:
        groups = df.groupby(step.groups, as_index=False, dropna=False)
    else:
        groups = [("", df)]

    result = pd.DataFrame()
    for (key, group) in groups:
        # this is used to keep the real date, if it exists, instead of the computed one by pd.Grouper
        group = group.assign(_old_date=group[step.dates_column])

        group_with_missing_dates = group.groupby(
            pd.Grouper(key=step.dates_column, freq=_FREQUENCIES[step.dates_granularity])
        ).agg("first")

        group_with_missing_dates = group_with_missing_dates.reset_index()
        group_with_missing_dates[step.groups] = key

        group_with_missing_dates[step.dates_column] = np.where(
            pd.isna(group_with_missing_dates["_old_date"]),
            at_begin_period(group_with_missing_dates[step.dates_column], step.dates_granularity),
            group_with_missing_dates["_old_date"],
        )
        del group_with_missing_dates["_old_date"]
        # Each group could have duplicate indexes with the previous ones
        # Ignoring the index prevents duplicate index values
        result = pd.concat([result, group_with_missing_dates], ignore_index=True)
    return result
