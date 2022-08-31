from typing import Literal

from pydantic import Field, root_validator

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import TemplatedVariable


class RenameStep(BaseStep):
    name: Literal["rename"] = "rename"
    to_rename: list[tuple[str, str]] = Field(..., alias="toRename")

    @root_validator(pre=True)
    def handle_legacy_syntax(cls, values):
        if "oldname" in values and "newname" in values:
            values["to_rename"] = [(values.pop("oldname"), values.pop("newname"))]
        return values


class RenameStepWithVariable(RenameStep, StepWithVariablesMixin):
    to_rename: TemplatedVariable | list[tuple[TemplatedVariable, TemplatedVariable]] = Field(
        ..., alias="toRename"
    )
