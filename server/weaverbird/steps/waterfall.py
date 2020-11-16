from typing import Any, Literal

import numpy
import pandas as pd
from pandas import DataFrame
from pydantic import Field

from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor


class WaterfallStep(BaseStep):
    name = Field('waterfall', const=True)
    valueColumn: ColumnName
    milestonesColumn: ColumnName
    start: Any
    end: Any
    labelsColumn: ColumnName
    sortBy: Literal['value', 'label']
    order: Literal['desc', 'asc']

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        start_df = df[df[self.milestonesColumn] == self.start].rename(
            columns={self.valueColumn: f'{self.valueColumn}_start'}
        )
        end_df = df[df[self.milestonesColumn] == self.end].rename(
            columns={self.valueColumn: f'{self.valueColumn}_end'}
        )
        merged_df = start_df.merge(end_df, on=self.labelsColumn)
        merged_df['result'] = (
            merged_df[f'{self.valueColumn}_end'] - merged_df[f'{self.valueColumn}_start']
        )
        result_df = DataFrame(
            {
                'LABEL_waterfall': pd.concat(
                    [pd.Series([self.start]), merged_df[self.labelsColumn], pd.Series([self.end])]
                ).astype(str)
            }
        )
        result_df['TYPE_waterfall'] = numpy.where(
            result_df['LABEL_waterfall'].isin([str(self.start), str(self.end)]), [None], ['Parent']
        )

        result_df[self.valueColumn] = pd.concat(
            [
                pd.Series([start_df[f'{self.valueColumn}_start'].sum()]),
                merged_df['result'],
                pd.Series([end_df[f'{self.valueColumn}_end'].sum()]),
            ]
        )
        return result_df
