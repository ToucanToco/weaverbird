from typing import List

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName


class ArgmaxStep(BaseStep):
    name = Field('argmax', const=True)
    column: ColumnName
    groups: List[str] = []

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        if len(self.groups) == 0:
            return df.sort_values(self.column, ascending=False)[0:1]  # we only want the top result
        else:
            grouped_by_df = df.groupby(self.groups, as_index=False)
            return df.assign(**{self.column: grouped_by_df[self.column].transform('max')})
