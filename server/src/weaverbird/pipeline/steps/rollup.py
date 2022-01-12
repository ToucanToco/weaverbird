from typing import List, Optional, Sequence, Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable

from .aggregate import Aggregation, AggregationWithVariables


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


class RollupStepWithVariable(RollupStep, StepWithVariablesMixin):
    aggregations: Sequence[AggregationWithVariables]
    hierarchy: Union[TemplatedVariable, List[TemplatedVariable]]
    groupby: Union[TemplatedVariable, List[TemplatedVariable]]
