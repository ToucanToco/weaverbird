from collections.abc import Sequence
from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable

from .aggregate import Aggregation, AggregationWithVariables


class RollupStep(BaseStep):
    name: Literal["rollup"] = "rollup"
    hierarchy: list[ColumnName]
    # The list of columnns to aggregate, with related aggregation function to use:
    aggregations: Sequence[Aggregation]
    # Groupby columns if rollup has to be performed by groups:
    groupby: list[ColumnName] | None
    # To give a custom name to the output label column:
    label_col: ColumnName | None = Field(alias="labelCol")
    # To give a custom name to the output level column:
    level_col: ColumnName | None = Field(alias="levelCol")
    # To give a custom name to the output parent column:
    parent_label_col: ColumnName | None = Field(alias="parentLabelCol")


class RollupStepWithVariable(RollupStep, StepWithVariablesMixin):
    aggregations: Sequence[AggregationWithVariables]
    hierarchy: TemplatedVariable | list[TemplatedVariable]
    groupby: TemplatedVariable | list[TemplatedVariable]
