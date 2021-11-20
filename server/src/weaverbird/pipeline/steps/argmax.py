from typing import List, Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class ArgmaxStep(BaseStep):
    name = Field('argmax', const=True)
    column: ColumnName
    groups: List[str] = []


class ArgmaxStepWithVariable(ArgmaxStep, StepWithVariablesMixin):
    groups: Union[TemplatedVariable, List[TemplatedVariable]]
