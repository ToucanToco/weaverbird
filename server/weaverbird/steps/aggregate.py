from typing import Any, List, Literal, Optional, Sequence

from pandas import DataFrame, concat
from pydantic import Field, root_validator
from pydantic.main import BaseModel

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName, PopulatedWithFieldnames, TemplatedVariable

AggregateFn = Literal[
    'avg',
    'sum',
    'min',
    'max',
    'count',
    'count distinct',
    'first',
    'last',
    'count distinct including empty',
]

functions_aliases = {
    'avg': 'mean',
    'count distinct': 'nunique',
    'count distinct including empty': len,
}


class Aggregation(BaseModel):
    class Config(PopulatedWithFieldnames):
        ...

    new_columns: List[ColumnName] = Field(alias='newcolumns')
    agg_function: AggregateFn = Field(alias='aggfunction')
    columns: List[ColumnName]

    @root_validator(pre=True)
    def handle_legacy_syntax(cls, values):
        if 'column' in values:
            values['columns'] = [values.pop('column')]
        if 'newcolumn' in values:
            values['new_columns'] = [values.pop('newcolumn')]
        return values


def get_aggregate_fn(agg_function: str) -> Any:
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
    on: List[ColumnName] = []
    aggregations: Sequence[Aggregation]
    keep_original_granularity: Optional[bool] = Field(
        default=False, alias='keepOriginalGranularity'
    )

    class Config(PopulatedWithFieldnames):
        ...

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None):
        group_by_columns = self.on

        # if no group is specified, we create a pseudo column with a single value
        if len(group_by_columns) == 0:
            group_by_columns = ['__VQB__GROUP_BY__']
            df = df.assign(**{group_by_columns[0]: True})

        grouped_by_df = df.groupby(group_by_columns, dropna=False)
        aggregated_cols = []
        for aggregation in self.aggregations:
            for col, new_col in zip(aggregation.columns, aggregation.new_columns):
                agg_serie = (
                    grouped_by_df[col]
                    .agg(get_aggregate_fn(aggregation.agg_function))
                    .rename(new_col)
                )
                aggregated_cols.append(agg_serie)

        df_result = concat(aggregated_cols, axis=1).reset_index()

        # it is faster this way, than to transform the original df
        if self.keep_original_granularity:
            df_result = df.merge(df_result, on=group_by_columns, how='left')

        # we do not want the pseudo column to ever leave this function
        if len(self.on) == 0:
            del df_result[group_by_columns[0]]
        return df_result


class AggregationWithVariables(Aggregation):
    class Config(PopulatedWithFieldnames):
        ...

    new_columns: List[TemplatedVariable] = Field(alias='newcolumns')
    agg_function: TemplatedVariable = Field(alias='aggfunction')
    columns: List[TemplatedVariable]


class AggregateStepWithVariables(AggregateStep, StepWithVariablesMixin):
    aggregations: Sequence[AggregationWithVariables]
