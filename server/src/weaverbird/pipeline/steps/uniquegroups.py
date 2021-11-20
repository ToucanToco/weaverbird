from typing import List, Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class UniqueGroupsStep(BaseStep):
    name = Field('uniquegroups', const=True)
    on: List[ColumnName]


class UniqueGroupsStepWithVariable(UniqueGroupsStep, StepWithVariablesMixin):
    on: Union[TemplatedVariable, List[TemplatedVariable]]
