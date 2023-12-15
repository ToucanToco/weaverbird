from typing import Literal

from pydantic import Field, model_validator

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class CumSumStep(BaseStep):
    name: Literal["cumsum"] = "cumsum"
    to_cumsum: list[tuple[str, str | None]] = Field(
        # NOTE: alias needs to be kept here, as to_cumsum does not translate to toCumSum in CamelCase
        ...,
        alias="toCumSum",
    )
    reference_column: ColumnName
    groupby: list[ColumnName] | None = None

    @model_validator(mode="before")
    @classmethod
    def handle_legacy_syntax(cls, values):
        if "valueColumn" in values:
            values["value_column"] = values.pop("valueColumn")
        if "newColumn" in values:
            values["new_column"] = values.pop("newColumn")

        if "value_column" in values:
            values["to_cumsum"] = [(values.pop("value_column"), values.pop("new_column", None))]
        return values


class CumSumStepWithVariable(CumSumStep, StepWithVariablesMixin):
    to_cumsum: TemplatedVariable | list[tuple[TemplatedVariable, TemplatedVariable]] = Field(
        # NOTE: alias needs to be kept here, as to_cumsum does not translate to toCumSum in CamelCase
        ...,
        alias="toCumSum",
    )
