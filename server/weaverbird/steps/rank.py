from typing import List, Literal, Optional

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName


class RankStep(BaseStep):
    name = Field('rank', const=True)
    value_col: ColumnName = Field(alias='valueCol')
    order: Literal['asc', 'desc']
    method: Literal['standard', 'dense']
    groupby: List[ColumnName] = []
    new_column_name: Optional[ColumnName] = Field(None, alias='newColumnName')

    class Config:
        allow_population_by_field_name = True

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        new_column_name = self.new_column_name or f'{self.value_col}_RANK'
        rank_method = 'min' if self.method == 'standard' else self.method
        ascending = self.order == 'asc'
        if self.groupby:
            serie = df.groupby(self.groupby)[self.value_col]
        else:
            serie = df[self.value_col]
        rank_serie = serie.rank(method=rank_method, ascending=ascending)
        return df.assign(**{new_column_name: rank_serie}).sort_values(new_column_name)
