from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName

from .utils.combination import PipelineOrDomainNameOrReference

JoinColumnsPair = tuple[ColumnName, ColumnName]


class JoinStep(BaseStep):
    name: Literal["join"] = "join"
    right_pipeline: PipelineOrDomainNameOrReference
    type: Literal["left", "inner", "left outer"]
    on: list[JoinColumnsPair] = Field(..., min_items=1)


class JoinStepWithVariable(JoinStep, StepWithVariablesMixin):
    ...
