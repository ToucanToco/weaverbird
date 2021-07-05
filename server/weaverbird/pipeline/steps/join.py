from typing import List, Literal, Tuple, Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName

from .utils.combination import PipelineOrDomainName

JoinColumnsPair = Tuple[ColumnName, ColumnName]


class JoinStep(BaseStep):
    name = Field('join', const=True)
    right_pipeline: Union[PipelineOrDomainName]
    type: Literal['left', 'inner', 'left outer']
    on: List[JoinColumnsPair] = Field(..., min_items=1)


class JoinStepWithVariable(JoinStep, StepWithVariablesMixin):
    ...
