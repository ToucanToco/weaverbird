from typing import List, Literal, Union

from mypy.applytype import Optional
from pandas import DataFrame
from pydantic import Field
from pydantic.main import BaseModel

from weaverbird.steps.base import BaseStep

ColumnName = Union[str, int, float]
AggregateFn = Literal['avg', 'sum', 'min', 'max']

functions_aliases = {'avg': 'mean'}

lambdas = {
    'sum': lambda x: x.sum(),
    'mean': lambda x: x.mean(),
    'min': lambda x: x.min(),
    'max': lambda x: x.max(),
}


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
    on: List[ColumnName] = Field(min_items=1)
    aggregations: List[Aggregation]
    keepOriginalGranularity: Optional[bool] = False


    def execute(self, df, domain_retriever):
        grouped_by_df = df.groupby(self.on, as_index=False)
        first_aggregation = self.aggregations[0]
        aggs = self.make_aggregation(first_aggregation)
        all_results = grouped_by_df.agg(aggs).rename(
            columns={
                col: new_col
                for col, new_col in zip(first_aggregation.columns, first_aggregation.new_columns)
            }
        )

        for idx, aggregation in enumerate(self.aggregations[1:]):
            aggs = self.make_aggregation(aggregation)
            all_results[self.on + aggregation.new_columns] = grouped_by_df.agg(aggs)[
                self.on + aggregation.columns
                ]
        # it is faster this way, than to trasnform the original df
        if self.keepOriginalGranularity:
            return df.merge(all_results, on=self.on, how='left')
        return all_results

    def make_aggregation(self, aggregation):
        return {
            column_name: get_aggregate_fn(aggregation.agg_function)
            for column_name in aggregation.columns
        }
