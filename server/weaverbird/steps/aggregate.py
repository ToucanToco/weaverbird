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
        grouped_by_df = df.groupby(self.on, as_index=False)
        all_results = pd.DataFrame()
        for aggregation in self.aggregations:
            aggregation_result = grouped_by_df.agg(
                {column_name: aggregation.agg_function for column_name in aggregation.columns})
            for (old_column_name, new_column_name) in zip(aggregation.columns, aggregation.new_columns):
                aggregation_result[new_column_name] = aggregation_result[old_column_name]
                del aggregation_result[old_column_name]
            for column in aggregation_result.columns:
                all_results[column] = aggregation_result[column]
        return all_results
