from typing import List, Literal

from mypy.applytype import Optional
from pydantic import Field
from pydantic.main import BaseModel

from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName

AggregateFn = Literal['avg', 'sum', 'min', 'max']

functions_aliases = {'avg': 'mean'}


class Aggregation(BaseModel):
    new_columns: List[ColumnName] = Field(alias='newcolumns')
    agg_function: AggregateFn = Field(alias='aggfunction')
    columns: List[ColumnName]


def get_aggregate_fn(agg_function: str) -> str:
    if agg_function in functions_aliases:
        return functions_aliases[agg_function]
    return agg_function


class AggregateStep(BaseStep):
    name = Field('aggregate', const=True)
    on: List[ColumnName] = Field(min_items=1)
    aggregations: List[Aggregation]
    keep_original_granularity: Optional[bool] = Field(
        default=False, alias='keepOriginalGranularity'
    )

    def execute(self, df, domain_retriever=None, execute_pipeline=None):
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
        if self.keep_original_granularity:
            return df.merge(all_results, on=self.on, how='left')
        return all_results

    def make_aggregation(self, aggregation):
        return {
            column_name: get_aggregate_fn(aggregation.agg_function)
            for column_name in aggregation.columns
        }
