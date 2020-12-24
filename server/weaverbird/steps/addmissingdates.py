from typing import List, Literal, Union

import pandas as pd
from pydantic import Field

from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor

# cf. https://pandas.pydata.org/pandas-docs/stable/user_guide/timeseries.html#offset-aliases
_FREQUENCIES = {'day': 'D', 'week': 'W', 'month': 'M'}


class AddMissingDatesStep(BaseStep):
    name = Field('addmissingdates', const=True)
    dates_column: ColumnName = Field(alias='datesColumn')
    granularity: Union[Literal['day']]
    groups: List[ColumnName] = []

    def execute(
        self,
        df: pd.DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> pd.DataFrame:
        if len(self.groups) > 0:
            groups = df.groupby(self.groups, as_index=False)
        else:
            groups = [('', df)]

        result = pd.DataFrame()
        for (key, group) in groups:
            group_with_missing_dates = group.groupby(
                pd.Grouper(key=self.dates_column, freq=_FREQUENCIES[self.granularity])
            ).agg('first')
            group_with_missing_dates[self.dates_column] = group_with_missing_dates.index
            group_with_missing_dates[self.groups] = key
            result = pd.concat([result, group_with_missing_dates])
        return result
