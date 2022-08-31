from typing import List, Literal, Union

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable

_TMP_GROUP_COL_NAME = "__TMP_COL_NAME"


class ArgminStep(BaseStep):
    name: Literal["argmin"] = "argmin"
    column: ColumnName
    groups: list[str] = []


class ArgminStepWithVariable(ArgminStep, StepWithVariablesMixin):
    groups: TemplatedVariable | list[TemplatedVariable]
