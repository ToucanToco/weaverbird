from typing import List

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName


class DeleteStep(BaseStep):
    name = Field('delete', const=True)
    columns: List[ColumnName]

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        return df.drop(self.columns, axis=1)
