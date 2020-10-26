from typing import Iterator, List, Literal, Tuple, Union, Any

import pandas as pd
from mypy.applytype import Optional
from pandas import DataFrame
from pandas.core.groupby import DataFrameGroupBy
from pydantic import Field
from pydantic.main import BaseModel

from weaverbird.steps.base import BaseStep

ColumnName = Union[str, int, float]
AggregateFn = Literal['avg', 'sum', 'min', 'max']

functions_aliases = {'avg': 'mean'}


class Aggregation(BaseModel):
    new_columns: List[ColumnName]
    agg_function: AggregateFn
    columns: List[ColumnName]


def get_aggregate_fn(agg_function: str) -> str:
    if agg_function in functions_aliases:
        return functions_aliases[agg_function]
    return agg_function


class AggregateStep(BaseStep):
    name = Field('aggregate', const=True)
    on: List[ColumnName]
    aggregations: List[Aggregation]
    keepOriginalGranularity: Optional[bool] = False

    def group_by(self, df: DataFrame) -> DataFrame:
        grouped_by_df = df.groupby(self.on, as_index=False)
        first_aggregation = self.aggregations[0]
        aggs = self.make_aggregation(first_aggregation)
        all_results = grouped_by_df.agg(aggs).rename(
            columns={col: new_col for col, new_col in
                     zip(first_aggregation.columns, first_aggregation.new_columns)})

        for idx, aggregation in enumerate(self.aggregations[1:]):
            aggs = self.make_aggregation(aggregation)
            all_results[self.on + aggregation.new_columns] = grouped_by_df.agg(aggs)[self.on + aggregation.columns]
        return all_results

    def simple_aggregate(self, df: DataFrame) -> DataFrame:
        first_aggregation = self.aggregations[0]
        aggs = self.make_aggregation(first_aggregation)
        aggregated_results = df.agg(aggs)
        all_results = DataFrame({column_name: [aggregated_results[column_name]] for column_name in first_aggregation.columns}) \
            .rename(
            columns={col: new_col for col, new_col in
                     zip(first_aggregation.columns, first_aggregation.new_columns)})
        return all_results

    def execute(self, df: DataFrame, domain_retriever) -> DataFrame:
        if len(self.aggregations) == 0:
            return self.simple_aggregate(df)
        if len(self.on) > 0:
            return self.group_by(df)

    def make_aggregation(self, aggregation):
        return {column_name: get_aggregate_fn(aggregation.agg_function) for column_name in aggregation.columns}
