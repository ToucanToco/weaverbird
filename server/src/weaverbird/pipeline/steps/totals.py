from typing import List, Literal, Sequence, Union

from pydantic import BaseConfig, BaseModel, Field, validator

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable

from .aggregate import Aggregation, AggregationWithVariables


class TotalDimension(BaseModel):
    total_column: ColumnName = Field(alias="totalColumn")
    total_rows_label: str = Field(alias="totalRowsLabel")

    class Config(BaseConfig):
        allow_population_by_field_name = True


class TotalsStep(BaseStep):
    name: Literal["totals"] = "totals"
    total_dimensions: List[TotalDimension] = Field(alias="totalDimensions")
    aggregations: Sequence[Aggregation]
    groups: List[ColumnName] = Field(min_items=0, default=[])

    @validator("aggregations")
    def aggregation_must_not_be_empty(cls, value):
        if len(value) < 1:
            raise ValueError("aggregations must contain at least one item")
        return value


class TotalsStepWithVariable(TotalsStep, StepWithVariablesMixin):
    aggregations: Sequence[AggregationWithVariables]
    groups: Union[TemplatedVariable, List[TemplatedVariable]]
