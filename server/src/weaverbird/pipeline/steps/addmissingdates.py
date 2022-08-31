from typing import Literal, Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable

DatesGranularity = Union[Literal["day"], Literal["week"], Literal["month"], Literal["year"]]


class AddMissingDatesStep(BaseStep):
    name: Literal["addmissingdates"] = "addmissingdates"
    dates_column: ColumnName = Field(alias="datesColumn")
    dates_granularity: DatesGranularity = Field(alias="datesGranularity")
    groups: list[ColumnName] = []


class AddMissingDatesStepWithVariables(AddMissingDatesStep, StepWithVariablesMixin):
    groups: list[TemplatedVariable] | TemplatedVariable
    dates_column: TemplatedVariable = Field(alias="datesColumn")
