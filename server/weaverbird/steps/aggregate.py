from typing import Iterator, List, Literal, Tuple, Union

import pandas as pd
from mypy.applytype import Optional
from pandas import DataFrame
from pydantic import Field
from pydantic.main import BaseModel

from weaverbird.steps.base import BaseStep

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
        if len(self.aggregations) == 0:
            return DataFrame()
        grouped_by_df = df.groupby(self.on, as_index=False)
        # the first aggregation. we create the result set
        first_aggregation = self.aggregations[0]
        aggs = self.make_aggregation(first_aggregation)
        all_results = grouped_by_df.agg(aggs).rename(
            columns={col: new_col for col, new_col in zip(first_aggregation.columns, first_aggregation.new_columns)})

        # for remaining aggregations, we concatenate the results.
        for idx, aggregation in enumerate(self.aggregations[1:]):
            aggs = self.make_aggregation(aggregation)
            all_results[aggregation.new_columns] = grouped_by_df.agg(aggs)[aggregation.columns]
        return all_results

    def make_aggregation(self, aggregation):
        return {column_name: aggregation.agg_function for column_name in aggregation.columns}
