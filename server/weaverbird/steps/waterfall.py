from typing import Any, List, Literal, Optional

import numpy
import pandas as pd
from pandas import DataFrame
from pydantic import Field

from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor

_RESULT_COLUMN = 'result'


class WaterfallStep(BaseStep):
    name = Field('waterfall', const=True)
    valueColumn: ColumnName
    milestonesColumn: ColumnName
    start: Any
    end: Any
    labelsColumn: ColumnName
    sortBy: Literal['value', 'label']
    order: Literal['desc', 'asc']
    parentsColumn: Optional[ColumnName]
    groupby: List[ColumnName] = []

    def get_sort_column(self):
        if self.sortBy == 'value':
            return _RESULT_COLUMN
        else:
            return self.labelsColumn

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
        merged_df = start_df.merge(end_df, on=[self.labelsColumn] + self.groupby)
        merged_df[_RESULT_COLUMN] = (
            merged_df[f'{self.valueColumn}_end'] - merged_df[f'{self.valueColumn}_start']
        )

        if len(self.groupby) > 0:
            groups = df[self.groupby].drop_duplicates()
        else:
            groups = pd.DataFrame({'value': [0]})  # pseudo group

        result_df = DataFrame(
            {
                'LABEL_waterfall': pd.concat(
                    [
                        groups.assign(label=self.start)['label'],
                        merged_df.sort_values(
                            by=self.get_sort_column(), ascending=self.order == 'asc'
                        )[self.labelsColumn],
                        groups.assign(label=self.end)['label'],
                    ]
                ).astype(str)
            }
        )

        result_df['TYPE_waterfall'] = numpy.where(
            result_df['LABEL_waterfall'].isin([str(self.start), str(self.end)]), [None], ['Parent']
        )
        # if self.parentsColumn is not None:
        #     label_to_parens = pd.DataFrame({self.labelsColumn: pd.unique(df[self.labelsColumn])})\
        #         .merge(df[[self.labelsColumn, self.parentsColumn]], on=self.labelsColumn).drop_duplicates()
        #
        #     result_df['GROUP_waterfall'] = numpy.where(
        #         result_df['LABEL_waterfall'].isin([str(self.start), str(self.end)]),
        #         result_df['LABEL_waterfall'],
        #         result_df.merge(label_to_parens, left_on='LABEL_waterfall', right_on=self.labelsColumn)[self.parentsColumn]
        #     )

        result_df[self.valueColumn] = pd.concat(
            [
                pd.Series([start_df[f'{self.valueColumn}_start'].sum()]),
                merged_df.sort_values(by=self.get_sort_column(), ascending=self.order == 'asc')[
                    _RESULT_COLUMN
                ],
                pd.Series([end_df[f'{self.valueColumn}_end'].sum()]),
            ]
        )
        return result_df
