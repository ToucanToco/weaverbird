from typing import List

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor


class PercentageStep(BaseStep):
    name = Field('percentage', const=True)
    column: ColumnName
    group: List[ColumnName] = Field(default=[])
    new_column_name: ColumnName = Field(alias='newColumnName', default=None)

    class Config:
        allow_population_by_field_name = True

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        new_column_name = self.new_column_name or f'{self.column}_PCT'

        if len(self.group) > 0:
            sums = df.groupby(self.group)[self.column].transform('sum')
        else:
            sums = df[self.column].sum()
        return df.assign(**{new_column_name: df[self.column] / sums * 100})
