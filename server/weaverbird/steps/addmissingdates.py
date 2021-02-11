from typing import List, Literal, Union

import numpy as np
import pandas as pd
from pandas import Series
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor, TemplatedVariable

# cf. https://pandas.pydata.org/pandas-docs/stable/user_guide/timeseries.html#offset-aliases
_FREQUENCIES = {'day': 'D', 'week': 'W', 'month': 'M', 'year': 'Y'}


def at_begin_period(timestamps: Series, dates_granularity: str):
    return timestamps.dt.to_period(_FREQUENCIES[dates_granularity]).dt.start_time


class AddMissingDatesStep(BaseStep):
    name = Field('addmissingdates', const=True)
    dates_column: ColumnName = Field(alias='datesColumn')
    dates_granularity: Union[
        Literal['day'], Literal['week'], Literal['month'], Literal['year']
    ] = Field(alias='datesGranularity')
    groups: List[ColumnName] = []

    def execute(
        self,
        df: pd.DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> pd.DataFrame:
        if len(self.groups) > 0:
            groups = df.groupby(self.groups, as_index=False, dropna=False)
        else:
            groups = [('', df)]

        result = pd.DataFrame()
        for (key, group) in groups:
            # this is used to keep the real date, if it exists, instead of the computed one by pd.Grouper
            group = group.assign(_old_date=group[self.dates_column])

            group_with_missing_dates = group.groupby(
                pd.Grouper(key=self.dates_column, freq=_FREQUENCIES[self.dates_granularity])
            ).agg('first')

            group_with_missing_dates = group_with_missing_dates.reset_index()
            group_with_missing_dates[self.groups] = key

            group_with_missing_dates[self.dates_column] = np.where(
                pd.isna(group_with_missing_dates['_old_date']),
                at_begin_period(
                    group_with_missing_dates[self.dates_column], self.dates_granularity
                ),
                group_with_missing_dates['_old_date'],
            )
            del group_with_missing_dates['_old_date']
            result = pd.concat([result, group_with_missing_dates])
        return result


class AddMissingDatesStepWithVariables(AddMissingDatesStep, StepWithVariablesMixin):
    groups: Union[List[TemplatedVariable], TemplatedVariable]
    dates_column: TemplatedVariable = Field(alias='datesColumn')
