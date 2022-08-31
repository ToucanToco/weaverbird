from typing import Any, Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class ReplaceStep(BaseStep):
    name: Literal["replace"] = "replace"
    search_column: ColumnName
    to_replace: list[tuple[Any, Any]] = Field(min_items=1)


class ReplaceStepWithVariable(ReplaceStep, StepWithVariablesMixin):
    to_replace: TemplatedVariable | list[tuple[TemplatedVariable, TemplatedVariable]]
