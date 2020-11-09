from typing import List, Literal, Optional

import numpy as np
from pandas import DataFrame
from pydantic import BaseModel, Field

from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName

DUMB_GROUPBY_COLUMN_NAME = '__dumb_groupby_column_name__'

Statistics = Literal['count', 'max', 'min', 'average', 'variance', 'standard deviation']


def statistic_to_pandas_method(s: str) -> str:
    if s == 'average':
        return 'mean'
    elif s == 'variance':
        return 'var'
    elif s == 'standard deviation':
        return 'std'
    return s


class Quantile(BaseModel):
    label: Optional[str]
    nth: int
    order: int


def percentile(nth, order):
    def f(serie):
        return np.percentile(serie, nth / order * 100)

    return f


class StatisticsStep(BaseStep):
    name = Field('statistics', const=True)
    column: ColumnName
    groupby_columns: List[ColumnName] = Field([], alias='groupbyColumns')
    statistics: List[Statistics]
    # Array of quantiles. Examples:
    # - median is 1rst quantile of order 2
    # - last decile is 9th quantile of order 10
    quantiles: List[Quantile]

    class Config:
        allow_population_by_field_name = True

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        groupby_columns = self.groupby_columns
        if not self.groupby_columns:
            # Just create a temporary dumb column with '1' everywhere
            # so we can group by this column:
            groupby_columns = [DUMB_GROUPBY_COLUMN_NAME]
            df = df.assign(**{DUMB_GROUPBY_COLUMN_NAME: 1})

        stat_funcs = [statistic_to_pandas_method(s) for s in self.statistics]
        stat_funcs += [percentile(q.nth, q.order) for q in self.quantiles]
        result = df.groupby(groupby_columns)[self.column].agg(stat_funcs).reset_index()

        # Now, just fix the column names:
        quantile_names = [q.label or f'{q.nth}-th {q.order}-quantile' for q in self.quantiles]
        column_names = groupby_columns + self.statistics + quantile_names  # type: ignore
        result.columns = column_names

        if not self.groupby_columns:
            # Remove the temporary column:
            del result[DUMB_GROUPBY_COLUMN_NAME]

        return result
