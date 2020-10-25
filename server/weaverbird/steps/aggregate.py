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
        all_results = pd.DataFrame()
        for aggregation in self.aggregations:
            aggregation_result = grouped_by_df.agg(
                {column_name: aggregation.agg_function for column_name in aggregation.columns}
            )
            aggregation_result = rename_columns(aggregation_result, zip(aggregation.columns, aggregation.new_columns))
            add_to_results(aggregation_result, all_results)
        return all_results


def add_to_results(aggregation_result, all_results):
    for column in aggregation_result.columns:
        all_results[column] = aggregation_result[column]


def rename_columns(aggregation_result: DataFrame, renames: Iterator[Tuple[ColumnName, ColumnName]]):
    return aggregation_result.rename(columns={old_col_name: new_col_name for (old_col_name, new_col_name) in renames})
