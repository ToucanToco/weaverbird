from typing import List, Literal, Tuple

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName

from .utils.combination import PipelineOrDomainNameOrReference

JoinColumnsPair = Tuple[ColumnName, ColumnName]


class JoinStep(BaseStep):
    name: Literal['join'] = 'join'
    right_pipeline: PipelineOrDomainNameOrReference
    type: Literal['left', 'inner', 'left outer']
    on: List[JoinColumnsPair] = Field(..., min_items=1)


class JoinStepWithVariable(JoinStep, StepWithVariablesMixin):
    ...
