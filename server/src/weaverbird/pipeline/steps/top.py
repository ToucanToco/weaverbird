from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class TopStep(BaseStep):
    name: Literal["top"] = "top"
    groups: list[ColumnName] = []
    rank_on: ColumnName
    sort: Literal["asc", "desc"]
    limit: int


class TopStepWithVariables(TopStep, StepWithVariablesMixin):
    sort: TemplatedVariable
    limit: TemplatedVariable
