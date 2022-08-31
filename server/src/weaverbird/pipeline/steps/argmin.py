from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class ArgminStep(BaseStep):
    name: Literal["argmin"] = "argmin"
    column: ColumnName
    groups: list[str] = []


class ArgminStepWithVariable(ArgminStep, StepWithVariablesMixin):
    groups: TemplatedVariable | list[TemplatedVariable]
