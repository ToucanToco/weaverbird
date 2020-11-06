from typing import List, Optional

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName


class RollupStep(BaseStep):
    name = Field('rollup', const=True)
    hierarchy: List[ColumnName]
    # The list of columnns to aggregate, with related aggregation function to use:
    aggregations: List[Aggregation]
    # Groupby columns if rollup has to be performed by groups:
    groupby: Optional[List[ColumnName]]
    # To give a custom name to the output label column:
    label_col: Optional[ColumnName] = Field(alias='labelCol')
    # To give a custom name to the output level column:
    level_col: Optional[ColumnName] = Field(alias='levelCol')
    # To give a custom name to the output parent column:
    parent_label_col: Optional[ColumnName] = Field(alias='parentLabelCol')

    class Config:
        allow_population_by_field_name = True

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        return df
