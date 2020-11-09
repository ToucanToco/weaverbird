from typing import List

import pydantic
from pandas import DataFrame
from pydantic import Field

from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor


class PercentageStep(BaseStep):
    name = Field('percentage', const=True)
    column: ColumnName
    group: List[ColumnName] = Field(default=[])
    new_column_name: ColumnName = Field(alias='newColumnName', default=None)

    # we use the validator to have a default value
    @pydantic.validator('new_column_name', pre=True, always=True)
    def default_ts_created(cls, v, *, values):
        return v or f'{values["column"]}_PCT'

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        if len(self.group) > 0:
            sums = df.groupby(self.group)[self.column].transform('sum')
        else:
            sums = df[self.column].sum()
        return df.assign(**{self.new_column_name: df[self.column] / sums * 100})
