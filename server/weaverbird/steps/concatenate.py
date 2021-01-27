from typing import List, Union

from pandas import DataFrame
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName, TemplatedVariable


class ConcatenateStep(BaseStep):
    name = Field('concatenate', const=True)
    columns: List[ColumnName] = Field(..., min_items=2)
    separator: str
    new_column_name: ColumnName

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        new_col = df[self.columns[0]].astype(str)
        for col_name in self.columns[1:]:
            new_col = new_col.str.cat(df[col_name].astype(str), sep=self.separator)
        return df.assign(**{self.new_column_name: new_col})


class ConcatenateStepWithVariable(ConcatenateStep, StepWithVariablesMixin):
    columns: Union[TemplatedVariable, List[TemplatedVariable]]
