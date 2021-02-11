from typing import List, Literal, Optional, Union

from pandas import DataFrame
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName, TemplatedVariable


class RankStep(BaseStep):
    name = Field('rank', const=True)
    value_col: ColumnName = Field(alias='valueCol')
    order: Literal['asc', 'desc']
    method: Literal['standard', 'dense']
    groupby: List[ColumnName] = []
    new_column_name: Optional[ColumnName] = Field(None, alias='newColumnName')

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        new_column_name = self.new_column_name or f'{self.value_col}_RANK'
        rank_method = 'min' if self.method == 'standard' else self.method
        ascending = self.order == 'asc'
        if self.groupby:
            serie = df.groupby(self.groupby, dropna=False)[self.value_col]
        else:
            serie = df[self.value_col]
        rank_serie = serie.rank(method=rank_method, ascending=ascending)
        return df.assign(**{new_column_name: rank_serie}).sort_values(new_column_name)


class RankStepWithVariable(RankStep, StepWithVariablesMixin):
    groupby: Union[TemplatedVariable, List[TemplatedVariable]]
