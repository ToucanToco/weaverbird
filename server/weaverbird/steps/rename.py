from typing import List, Tuple

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps.base import BaseStep


class RenameStep(BaseStep):
    name = Field('rename', const=True)
    to_rename: List[Tuple[str, str]] = Field(..., alias='toRename')

    class Config:
        allow_population_by_field_name = True

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        return df.rename(columns=dict(self.to_rename))
