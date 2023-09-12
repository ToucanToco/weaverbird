from collections.abc import Sequence
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.steps.utils.validation import validate_unique_columns
from weaverbird.pipeline.types import ColumnName, TemplatedVariable

AggregateFn = Literal[
    "avg",
    "sum",
    "min",
    "max",
    "count",
    "count distinct",
    "first",
    "last",
    "count distinct including empty",
]


class Aggregation(BaseModel):
    new_columns: list[ColumnName] = Field(alias="newcolumns")
    agg_function: AggregateFn = Field(alias="aggfunction")
    columns: list[ColumnName]
    model_config = ConfigDict(populate_by_name=True)

    @field_validator("columns", mode="before")
    @classmethod
    def validate_unique_columns(cls, value):
        return validate_unique_columns(value)

    @model_validator(mode="before")
    @classmethod
    def handle_legacy_syntax(cls, values):
        if "column" in values:
            values["columns"] = [values.pop("column")]
        if "newcolumn" in values:
            values["new_columns"] = [values.pop("newcolumn")]
        return values


class AggregateStep(BaseStep):
    name: Literal["aggregate"] = "aggregate"
    on: list[ColumnName] = []
    aggregations: Sequence[Aggregation]
    keep_original_granularity: bool | None = False


class AggregationWithVariables(Aggregation):
    new_columns: list[TemplatedVariable] = Field(alias="newcolumns")
    agg_function: TemplatedVariable = Field(alias="aggfunction")
    columns: list[TemplatedVariable]


class AggregateStepWithVariables(AggregateStep, StepWithVariablesMixin):
    aggregations: Sequence[AggregationWithVariables]
