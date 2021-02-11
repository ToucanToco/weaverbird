from typing import List, Optional

from pandas import DataFrame
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName


class CumSumStep(BaseStep):
    name = Field('cumsum', const=True)
    value_column: ColumnName = Field(..., alias='valueColumn')
    reference_column: ColumnName = Field(..., alias='referenceColumn')
    groupby: Optional[List[ColumnName]]
    new_column: Optional[ColumnName] = Field(None, alias='newColumn')

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        df = df.sort_values(self.reference_column)
        dst_column = self.new_column or f'{self.value_column}_CUMSUM'
        df_grouped = df.groupby(self.groupby, dropna=False) if self.groupby else df
        cumsum_serie = df_grouped[self.value_column].cumsum()
        return df.assign(**{dst_column: cumsum_serie})


class CumSumStepWithVariable(CumSumStep, StepWithVariablesMixin):
    ...
