from typing import List

import pandas as pd
from pydantic import BaseModel, Field

from weaverbird.steps import AggregateStep, BaseStep
from weaverbird.steps.aggregate import Aggregation
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor


class TotalDimension(BaseModel):
    class Config:
        allow_population_by_field_name = True

    total_column: ColumnName = Field(alias='totalColumn')
    total_rows_label: str = Field(alias='totalRowsLabel')


class TotalsStep(BaseStep):
    name = Field('totals', const=True)
    total_dimensions: List[TotalDimension] = Field(alias='totalDimensions')
    aggregations: List[Aggregation] = Field(min_items=1)
    groups: List[ColumnName] = Field(min_items=0, default=[])

    class Config:
        allow_population_by_field_name = True

    def execute(
        self,
        df: pd.DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> pd.DataFrame:

        total_rows = []
        # for total_dimension in self.total_dimensions:
        total_rows.append(self.get_total_for_dimensions(df))

        if len(self.groups) > 0:
            total_rows.append(self.get_total_for_group(df, self.groups))

        # rename columns in the base df, so it will match with the total in schema
        col_to_rm = set()
        for aggregation in self.aggregations:
            for col, new_col in zip(aggregation.columns, aggregation.new_columns):
                if col != new_col:
                    df[new_col] = df[col]
                    col_to_rm.add(col)
        for col in col_to_rm:
            del df[col]

        result = pd.concat([df] + total_rows)
        return result.drop_duplicates()

    def get_total_for_group(self, df, group) -> pd.DataFrame:
        aggregation = AggregateStep(
            name='aggregate',
            keepOriginalGranularity=False,
            aggregations=self.aggregations,
            on=group,
        )
        df_result = aggregation.execute(df)
        for total_dimension in self.total_dimensions:
            df_result[total_dimension.total_column] = total_dimension.total_rows_label
        return df_result

    def get_total_for_dimensions(self, df):
        group_by_columns = self.groups + [dim.total_column for dim in self.total_dimensions]

        aggregation = AggregateStep(
            name='aggregate',
            keepOriginalGranularity=False,
            aggregations=self.aggregations,
            on=group_by_columns,
        )
        aggregated_df = aggregation.execute(df)

        result_df = pd.DataFrame()
        for dimension in self.total_dimensions:
            result_df = pd.concat(
                [result_df, self.get_total_for_dimension(aggregated_df, dimension, [])]
            )
        return result_df.drop_duplicates()

    def get_total_for_dimension(
        self, df, total_dimension: TotalDimension, dimensions_to_skip
    ) -> pd.DataFrame:
        # get all group_by columns: all total_dimensions, except the current one + groups
        # all columns that are either not aggregated, or groups, or total will be null
        group_by_columns = self.groups + [
            group_column.total_column
            for group_column in self.total_dimensions
            if group_column != total_dimension
        ]
        aggregations = []
        for aggregation in self.aggregations:
            agg = aggregation.copy()
            agg.columns = agg.new_columns
            aggregations.append(agg)

        aggregation = AggregateStep(
            name='aggregate',
            keepOriginalGranularity=False,
            aggregations=aggregations,
            on=group_by_columns,
        )
        aggregated_df = aggregation.execute(df)

        aggregated_df[total_dimension.total_column] = total_dimension.total_rows_label
        full_aggregation = aggregated_df.copy()
        for dimension in self.total_dimensions:
            if dimension not in dimensions_to_skip and dimension != total_dimension:
                full_aggregation = pd.concat(
                    [
                        full_aggregation,
                        self.get_total_for_dimension(
                            aggregated_df, dimension, dimensions_to_skip + [dimension]
                        ),
                    ]
                )

        if 'VQB_GROUP_BY' in full_aggregation:
            del full_aggregation['VQB_GROUP_BY']
        return full_aggregation.drop_duplicates()
