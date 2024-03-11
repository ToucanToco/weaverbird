from typing import Any, Literal

from pydantic import Field, model_validator

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName


class FillnaStep(BaseStep):
    name: Literal["fillna"] = "fillna"
    columns: list[ColumnName] = Field(min_length=1)
    value: Any

    @model_validator(mode="before")
    @classmethod
    def handle_legacy_syntax(cls, values):
        if "column" in values:
            values["columns"] = [values.pop("column")]
        return values


class FillnaStepWithVariable(FillnaStep, StepWithVariablesMixin): ...
