from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class UniqueGroupsStep(BaseStep):
    name: Literal["uniquegroups"] = "uniquegroups"
    on: list[ColumnName]


class UniqueGroupsStepWithVariable(UniqueGroupsStep, StepWithVariablesMixin):
    on: TemplatedVariable | list[TemplatedVariable]
