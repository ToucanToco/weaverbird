from typing import List, Optional, Sequence, Union

from pandas import DataFrame, concat
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName, TemplatedVariable

from .aggregate import AggregateStep, Aggregation, AggregationWithVariables


class RollupStep(BaseStep):
    name = Field('rollup', const=True)
    hierarchy: List[ColumnName]
    # The list of columnns to aggregate, with related aggregation function to use:
    aggregations: Sequence[Aggregation]
    # Groupby columns if rollup has to be performed by groups:
    groupby: Optional[List[ColumnName]]
    # To give a custom name to the output label column:
    label_col: Optional[ColumnName] = Field(alias='labelCol')
    # To give a custom name to the output level column:
    level_col: Optional[ColumnName] = Field(alias='levelCol')
    # To give a custom name to the output parent column:
    parent_label_col: Optional[ColumnName] = Field(alias='parentLabelCol')

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        label_col = self.label_col or 'label'
        level_col = self.level_col or 'level'
        parent_label_col = self.parent_label_col or 'parent'

        full_current_hierarchy = []
        all_results = []
        previous_level = None

        for current_level in self.hierarchy:
            full_current_hierarchy.append(current_level)
            aggregate_on_cols = (self.groupby or []) + full_current_hierarchy
            results_for_this_level = AggregateStep(
                name='aggregate',
                on=aggregate_on_cols,
                aggregations=self.aggregations,
                keepOriginalGranularity=False,
            ).execute(df)

            results_for_this_level[level_col] = current_level
            results_for_this_level[label_col] = results_for_this_level[current_level]
            if previous_level is not None:
                results_for_this_level[parent_label_col] = results_for_this_level[previous_level]

            all_results.append(results_for_this_level)
            previous_level = current_level

        columns = (
            self.hierarchy[::-1]
            + (self.groupby or [])
            + [label_col, level_col, parent_label_col]
            + sum([agg.new_columns for agg in self.aggregations], start=[])
        )  # type: ignore

        return concat(all_results)[columns]


class RollupStepWithVariable(RollupStep, StepWithVariablesMixin):
    aggregations: Sequence[AggregationWithVariables]
    hierarchy: Union[TemplatedVariable, List[TemplatedVariable]]
    groupby: Union[TemplatedVariable, List[TemplatedVariable]]
