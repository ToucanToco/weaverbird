from typing import List, Literal, Union

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class ArgmaxStep(BaseStep):
    name: Literal['argmax'] = 'argmax'
    column: ColumnName
    groups: List[str] = []


class ArgmaxStepWithVariable(ArgmaxStep, StepWithVariablesMixin):
    groups: Union[TemplatedVariable, List[TemplatedVariable]]
