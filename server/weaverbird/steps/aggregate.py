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
        grouped_by_df = df.groupby(self.on, as_index=False)
        for idx, aggregation in enumerate(self.aggregations):
            aggs = {column_name: aggregation.agg_function for column_name in aggregation.columns}
            if idx == 0:
                # creation of the dataframe
                all_results = grouped_by_df.agg(aggs).rename(
                    columns={col: new_col for col, new_col in zip(aggregation.columns, aggregation.new_columns)})
            else:
                # assignation of new columns in the existing dataframe
                all_results[aggregation.new_columns] = grouped_by_df.agg(aggs)[aggregation.columns]
        return all_results
