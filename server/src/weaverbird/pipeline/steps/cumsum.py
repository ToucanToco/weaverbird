from typing import Literal

from pydantic import Field, root_validator

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class CumSumStep(BaseStep):
    name: Literal["cumsum"] = "cumsum"
    to_cumsum: list[tuple[str, str | None]] = Field(..., alias="toCumSum")
    reference_column: ColumnName = Field(..., alias="referenceColumn")
    groupby: list[ColumnName] | None

    @root_validator(pre=True)
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
        ..., alias="toCumSum"
    )
