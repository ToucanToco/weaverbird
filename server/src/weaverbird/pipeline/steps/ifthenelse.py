from typing import Any, Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseModel, BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName

from ..conditions import Condition


class IfThenElse(BaseModel):
    condition: Condition = Field(alias="if")
    then: Any
    else_value: "IfThenElse" | Any = Field(alias="else")
    # NOTE: Some existing pipelines may already have defined this in a nested ifthenelse block. Our
    # BaseStep models forbids extra values, so we add this here too
    name: Literal["ifthenelse"] = "ifthenelse"


IfThenElse.update_forward_refs()


class IfthenelseStep(BaseStep, IfThenElse):
    name: Literal["ifthenelse"] = "ifthenelse"
    new_column: ColumnName


class IfThenElseStepWithVariables(IfthenelseStep, StepWithVariablesMixin):
    ...
