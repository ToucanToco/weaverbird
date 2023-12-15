from typing import Any, Literal, Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseModel, BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName

from ..conditions import Condition


class IfThenElse(BaseModel):
    condition: Condition = Field(alias="if")
    then: Any
    # We can't use | with a quoted type in python 3.11
    else_value: Union["IfThenElse", Any] = Field(alias="else")
    # NOTE: Some existing pipelines may already have defined this in a nested ifthenelse block. Our
    # BaseStep models forbids extra values, so we add this here too
    name: Literal["ifthenelse"] = "ifthenelse"


IfThenElse.model_rebuild()


class IfthenelseStep(BaseStep, IfThenElse):
    name: Literal["ifthenelse"] = "ifthenelse"
    new_column: ColumnName


class IfThenElseStepWithVariables(IfthenelseStep, StepWithVariablesMixin):
    ...
