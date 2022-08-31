from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class ArgmaxStep(BaseStep):
    name: Literal["argmax"] = "argmax"
    column: ColumnName
    groups: list[str] = []


class ArgmaxStepWithVariable(ArgmaxStep, StepWithVariablesMixin):
    groups: TemplatedVariable | list[TemplatedVariable]
