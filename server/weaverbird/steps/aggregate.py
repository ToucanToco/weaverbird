from abc import ABC, abstractmethod
from typing import List, Literal, Union, Dict

from mypy.applytype import Optional
from numpy.ma import logical_and, logical_or
from pandas import DataFrame, Series
from pydantic import Field
from pydantic.main import BaseModel

from weaverbird.steps.base import BaseStep
import pandas as pd

ColumnName = Union[str, int, float]
AggregateFn = Literal['avg', 'sum', 'min', 'max']


class Aggregation(BaseModel):
    new_columns: List[ColumnName]
    agg_function: AggregateFn
    columns: List[ColumnName]


class AggregateStep(BaseStep):
    name = Field('aggregate', const=True)
    on: List[ColumnName]
    aggregations: List[Aggregation]
    keepOriginalGranularity: Optional[bool] = False

    def execute(self, df: DataFrame, domain_retriever) -> DataFrame:
        return df.groupby(self.on).agg()
