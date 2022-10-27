from collections.abc import Sequence
from typing import Literal

from pydantic import Field, validator

from weaverbird.pipeline.steps.utils.base import BaseModel, BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable

from .aggregate import Aggregation, AggregationWithVariables


class TotalDimension(BaseModel):
    total_column: ColumnName
    total_rows_label: str


class TotalsStep(BaseStep):
    name: Literal["totals"] = "totals"
    total_dimensions: list[TotalDimension]
    aggregations: Sequence[Aggregation]
    groups: list[ColumnName] = Field(min_items=0, default_factory=list)

    @validator("aggregations")
    def aggregation_must_not_be_empty(cls, value):
        if len(value) < 1:
            raise ValueError("aggregations must contain at least one item")
        return value


class TotalsStepWithVariable(TotalsStep, StepWithVariablesMixin):
    aggregations: Sequence[AggregationWithVariables]
    groups: TemplatedVariable | list[TemplatedVariable]
