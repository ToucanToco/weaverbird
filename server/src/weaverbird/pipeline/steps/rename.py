from typing import List, Tuple, Union

from pydantic import Field, root_validator

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import TemplatedVariable


class RenameStep(BaseStep):
    name = Field('rename', const=True)
    to_rename: List[Tuple[str, str]] = Field(..., alias='toRename')

    @root_validator(pre=True)
    def handle_legacy_syntax(cls, values):
        if 'oldname' in values and 'newname' in values:
            values['to_rename'] = [(values.pop('oldname'), values.pop('newname'))]
        return values


class RenameStepWithVariable(RenameStep, StepWithVariablesMixin):
    to_rename: Union[TemplatedVariable, List[Tuple[TemplatedVariable, TemplatedVariable]]] = Field(
        ..., alias='toRename'
    )
