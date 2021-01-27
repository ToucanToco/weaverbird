from typing import Any, List, Literal, Optional, Union

import numpy
import pandas as pd
from pandas import DataFrame
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor, TemplatedVariable

TYPE_WATERFALL_COLUMN = 'TYPE_waterfall'
LABEL_WATERFALL_COLUMN = 'LABEL_waterfall'
GROUP_WATERFALL_COLUMN = 'GROUP_waterfall'

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

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        # first milestone
        start_df = df[df[self.milestonesColumn] == self.start].rename(
            columns={self.valueColumn: f'{self.valueColumn}_start'}
        )
        # second milestone
        end_df = df[df[self.milestonesColumn] == self.end].rename(
            columns={self.valueColumn: f'{self.valueColumn}_end'}
        )

        upper = self.compute_agg_milestone(
            df, start_df.rename(columns={f'{self.valueColumn}_start': self.valueColumn}), self.start
        )
        mid = self.compute_mid(self.merge(start_df, end_df), df)
        downer = self.compute_agg_milestone(
            df, end_df.rename(columns={f'{self.valueColumn}_end': self.valueColumn}), self.end
        )
        return pd.concat([upper, mid, downer])

    # start_df is the base dataframe filtered to contains only result at the start of the waterfall
    # end_df is the base dataframe filtered to contains only result at the start of the waterfall
    # this methods compute the difference for the value value of every label between the end and the start
    def merge(self, start_df, end_df):

        group_by_columns = [self.labelsColumn] + self.groupby
        if self.parentsColumn is not None:
            group_by_columns = group_by_columns + [self.parentsColumn]
        start_df = (
            start_df.groupby(by=group_by_columns)
            .agg({self.valueColumn + '_start': 'sum'})
            .merge(start_df[group_by_columns], on=group_by_columns)
            .rename(columns={self.labelsColumn + '_x': self.labelsColumn})
            .drop_duplicates()
        )

        end_df = (
            end_df.groupby(by=group_by_columns)
            .agg({self.valueColumn + '_end': 'sum'})
            .merge(end_df[group_by_columns], on=group_by_columns)
            .rename(columns={self.labelsColumn + '_x': self.labelsColumn})
            .drop_duplicates()
        )
        # we join the result to compare them
        merged_df = start_df.merge(end_df, on=self.get_join_key())
        merged_df[_RESULT_COLUMN] = (
            merged_df[f'{self.valueColumn}_end'] - merged_df[f'{self.valueColumn}_start']
        )
        merged_df = merged_df.drop(
            columns=[
                f'{self.valueColumn}_start',
                f'{self.valueColumn}_end',
            ]
        )

        # if there is a parent column, we need to aggregate for them
        if self.parentsColumn is not None:
            parents_results = merged_df.groupby(
                self.groupby + [self.parentsColumn], as_index=False
            ).agg({_RESULT_COLUMN: 'sum'})
            parents_results[self.labelsColumn] = parents_results[self.parentsColumn]
            return pd.concat([merged_df, parents_results])
        return merged_df

    # the waterfall has a very specific structure.
    # this methods create the top / bottom rows.
    # these contains the sum of values for the whole milestone, regardless of label.
    def compute_agg_milestone(self, df, start_df, milestone) -> pd.DataFrame:
        if len(self.groupby) > 0:
            groups = df[self.groupby].drop_duplicates()
            group_by = self.groupby
        else:
            groups = pd.DataFrame({'_VQB_GROUP': [0]})  # pseudo group
            start_df['_VQB_GROUP'] = 0
            groups['_VQB_GROUP'] = 0
            group_by = ['_VQB_GROUP']

        groups = groups.assign(**{self.labelsColumn: milestone})

        agg = start_df.groupby(group_by).agg({f'{self.valueColumn}': 'sum'})
        agg = (
            groups.merge(agg, on=group_by)
            .sort_values(
                by=self.valueColumn if self.sortBy == 'value' else self.labelsColumn,
                ascending=self.order == 'asc',
            )
            .rename(columns={self.labelsColumn: LABEL_WATERFALL_COLUMN})
        )

        if self.parentsColumn is not None:
            agg[GROUP_WATERFALL_COLUMN] = agg[LABEL_WATERFALL_COLUMN].astype(str)
        agg[TYPE_WATERFALL_COLUMN] = None
        agg[LABEL_WATERFALL_COLUMN] = agg[LABEL_WATERFALL_COLUMN].astype(str)
        if len(self.groupby) == 0:
            del start_df['_VQB_GROUP']
            del agg['_VQB_GROUP']
        return agg

    # this method shapes the merged DF so it matches the waterfall format
    def compute_mid(self, merged_df, df):
        result_df = DataFrame(
            {
                LABEL_WATERFALL_COLUMN: merged_df.sort_values(
                    by=self.get_sort_column(), ascending=self.order == 'asc'
                )[self.labelsColumn].astype(str)
            }
        )
        result_df[self.groupby] = merged_df.sort_values(
            by=self.get_sort_column(), ascending=self.order == 'asc'
        )[self.groupby]

        if self.parentsColumn is None:
            result_df[TYPE_WATERFALL_COLUMN] = 'Parent'
        else:
            result_df[TYPE_WATERFALL_COLUMN] = numpy.where(
                result_df['LABEL_waterfall'].isin(df[self.labelsColumn]), ['child'], ['parent']
            )
            result_df[GROUP_WATERFALL_COLUMN] = merged_df.sort_values(
                by=self.get_sort_column(), ascending=self.order == 'asc'
            )[self.parentsColumn]

        result_df[self.valueColumn] = merged_df.sort_values(
            by=self.get_sort_column(), ascending=self.order == 'asc'
        )[_RESULT_COLUMN]
        return result_df

    def get_sort_column(self):
        if self.sortBy == 'value':
            return _RESULT_COLUMN
        else:
            return self.labelsColumn

    def get_join_key(self):
        if self.parentsColumn is None:
            return [self.labelsColumn] + self.groupby
        else:
            return [self.labelsColumn, self.parentsColumn] + self.groupby


class WaterfallStepWithVariable(WaterfallStep, StepWithVariablesMixin):
    groupby: Union[TemplatedVariable, List[TemplatedVariable]]
