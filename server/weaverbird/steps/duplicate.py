from pandas import DataFrame
from pydantic import Field

from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName


class DuplicateStep(BaseStep):
    name = Field('duplicate', const=True)
    column: ColumnName
    new_column_name: ColumnName

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        return df.assign(**{self.new_column_name: df[self.column]})
