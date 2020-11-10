from typing import List

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName


class UniqueGroupsStep(BaseStep):
    name = Field('uniquegroups', const=True)
    on: List[ColumnName]

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        return df[self.on].drop_duplicates()
