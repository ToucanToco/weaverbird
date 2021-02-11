from typing import List, Optional

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor


class MovingAverageStep(BaseStep):
    name = Field('movingaverage', const=True)

    value_column: Optional[ColumnName] = Field(None, alias='valueColumn')
    column_to_sort: ColumnName = Field(alias='columnToSort')
    moving_window: int = Field(alias='movingWindow')
    groups: List[ColumnName] = []
    new_column_name: Optional[ColumnName] = Field(alias='newColumnName')

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        new_column_name = self.new_column_name or f'{self.value_column}_MOVING_AVG'
        df = df.sort_values(by=self.groups + [self.column_to_sort]).reset_index(drop=True)
        if self.groups:
            df_grouped = df.groupby(self.groups, dropna=False)
        else:
            df_grouped = df
        serie = (
            df_grouped.rolling(self.moving_window).mean()[self.value_column].reset_index(drop=True)
        )
        return df.assign(**{new_column_name: serie})
