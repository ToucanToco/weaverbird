from typing import Any, Literal

from pydantic import BaseConfig, BaseModel, Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName

from ..conditions import Condition


class IfThenElse(BaseModel):
    class Config(BaseConfig):
        allow_population_by_field_name = True

    condition: Condition = Field(alias="if")
    then: Any
    else_value: "IfThenElse" | Any = Field(alias="else")


IfThenElse.update_forward_refs()


class IfthenelseStep(BaseStep, IfThenElse):
    name: Literal["ifthenelse"] = "ifthenelse"
    new_column: ColumnName = Field(alias="newColumn")

    class Config(BaseConfig):
        allow_population_by_field_name = True


class IfThenElseStepWithVariables(IfthenelseStep, StepWithVariablesMixin):
    class Config(BaseConfig):
        allow_population_by_field_name = True
