from typing import Optional

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor


class SubstringStep(BaseStep):
    name = Field('substring', const=True)
    column: ColumnName
    new_column_name: Optional[ColumnName] = Field(alias='newColumnName')
    start_index: int
    end_index: int

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        new_column_name = self.new_column_name or f'{self.column}_SUBSTR'
        # Weaverbird indexes start at one
        start_index = self.start_index - 1
        # Weaverbird substring end_index is inclusive. in python, it is exclusive. therefore, no need to substract one
        end_index = self.end_index

        if end_index < 0:
            end_index += 1
        if start_index < 0:
            start_index += 1

        # there is no way to get the full string with a x[start:end] when end is negative.
        if end_index == 0:
            serie = df[self.column].str[start_index:]
        else:
            serie = df[self.column].str[start_index:end_index]

        return df.assign(**{new_column_name: serie})
