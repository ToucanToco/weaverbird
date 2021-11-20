from typing import Any, Union

from pydantic import BaseModel, Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, PopulatedWithFieldnames

from ..conditions import Condition


class IfThenElse(BaseModel):
    class Config(PopulatedWithFieldnames):
        ...

    condition: Condition = Field(alias='if')
    then: Any
    else_value: Union['IfThenElse', Any] = Field(alias='else')


IfThenElse.update_forward_refs()


class IfthenelseStep(BaseStep, IfThenElse):
    class Config(PopulatedWithFieldnames):
        ...

    name = Field('ifthenelse', const=True)
    new_column: ColumnName = Field(alias='newColumn')


class IfThenElseStepWithVariables(IfthenelseStep, StepWithVariablesMixin):
    class Config(PopulatedWithFieldnames):
        ...
