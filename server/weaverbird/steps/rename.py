from typing import List, Tuple

from pandas import DataFrame
from pydantic import Field, root_validator

from weaverbird.steps.base import BaseStep


class RenameStep(BaseStep):
    name = Field('rename', const=True)
    to_rename: List[Tuple[str, str]] = Field(..., alias='toRename')

    @root_validator(pre=True)
    def handle_legacy_syntax(cls, values):
        if 'oldname' in values and 'newname' in values:
            values['to_rename'] = [(values.pop('oldname'), values.pop('newname'))]
        return values

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        return df.rename(columns=dict(self.to_rename))
