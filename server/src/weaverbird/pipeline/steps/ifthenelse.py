from collections.abc import Callable
from typing import Any, Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseModel, BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName

from ..conditions import Condition, ConditionWithVariables


class IfThenElse(BaseModel):
    condition: Condition = Field(alias="if")
    then: Any
    # We can't use | with a quoted type in python 3.11
    else_value: "IfThenElse | Any" = Field(alias="else")
    # NOTE: Some existing pipelines may already have defined this in a nested ifthenelse block. Our
    # BaseStep models forbids extra values, so we add this here too
    name: Literal["ifthenelse"] = "ifthenelse"


IfThenElse.model_rebuild()


class IfThenElseWithVariables(IfThenElse):
    condition: ConditionWithVariables = Field(alias="if")  # type:ignore[assignment]
    else_value: "IfThenElseWithVariables | Any" = Field(alias="else")


IfThenElseWithVariables.model_rebuild()


class IfthenelseStep(BaseStep, IfThenElse):
    name: Literal["ifthenelse"] = "ifthenelse"
    new_column: ColumnName


class IfThenElseStepWithVariables(BaseStep, IfThenElseWithVariables, StepWithVariablesMixin):
    name: Literal["ifthenelse"] = "ifthenelse"
    new_column: ColumnName

    def render(self, variables: dict[str, Any], renderer: Callable[[Any, Any], Any]) -> IfthenelseStep:
        step_as_dict = self.model_dump()  # type: ignore
        rendered_dict = renderer(step_as_dict, variables)
        return IfthenelseStep(**rendered_dict)
