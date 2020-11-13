from typing import List, Literal, Optional

from pydantic import Field
from pydantic.main import BaseModel

from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName

AggregateFn = Literal['avg', 'sum', 'min', 'max', 'count', 'first', 'last']

functions_aliases = {'avg': 'mean'}


class Aggregation(BaseModel):
    new_columns: List[ColumnName] = Field(alias='newcolumns')
    agg_function: AggregateFn = Field(alias='aggfunction')
    columns: List[ColumnName]


def get_aggregate_fn(agg_function: str) -> str:
    if agg_function in functions_aliases:
        return functions_aliases[agg_function]
    return agg_function


def make_aggregation(aggregation: Aggregation) -> dict:
    return {
        column_name: get_aggregate_fn(aggregation.agg_function)
        for column_name in aggregation.columns
    }


class AggregateStep(BaseStep):
    name = Field('aggregate', const=True)
    on: List[ColumnName] = Field(min_items=0)
    aggregations: List[Aggregation]
    keep_original_granularity: Optional[bool] = Field(
        default=False, alias='keepOriginalGranularity'
    )

    class Config:
        allow_population_by_field_name = True

    def execute(self, df, domain_retriever=None, execute_pipeline=None):
        group_by_columns = self.on

        # if no group is specified, we create a pseudo column with a single value
        if len(group_by_columns) == 0:
            group_by_columns = ['__VQB__GROUP_BY__']
            df[group_by_columns[0]] = True

        grouped_by_df = df.groupby(group_by_columns, as_index=False)
        first_aggregation = self.aggregations[0]
        aggs = make_aggregation(first_aggregation)
        all_results = grouped_by_df.agg(aggs).rename(
            columns={
                col: new_col
                for col, new_col in zip(first_aggregation.columns, first_aggregation.new_columns)
            }
        )
        # we do not want the pseudo column to ever leave this function
        if len(self.on) == 0:
            del df[group_by_columns[0]]
            del all_results[group_by_columns[0]]

        for idx, aggregation in enumerate(self.aggregations[1:]):
            aggs = make_aggregation(aggregation)
            all_results[group_by_columns + aggregation.new_columns] = grouped_by_df.agg(aggs)[
                group_by_columns + aggregation.columns
            ]

        # it is faster this way, than to trasnform the original df
        if self.keep_original_granularity:
            return df.merge(all_results, on=group_by_columns, how='left')
        return all_results
