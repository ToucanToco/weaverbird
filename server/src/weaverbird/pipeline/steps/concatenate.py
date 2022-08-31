from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class ConcatenateStep(BaseStep):
    name: Literal["concatenate"] = "concatenate"
    columns: list[ColumnName] = Field(..., min_items=2)
    separator: str
    new_column_name: ColumnName


class ConcatenateStepWithVariable(ConcatenateStep, StepWithVariablesMixin):
    columns: TemplatedVariable | list[TemplatedVariable]
