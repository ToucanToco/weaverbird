from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName

TIME_INFO = Literal[
    "days",
    "hours",
    "minutes",
    "seconds",
    "milliseconds",
    "total_days",
    "total_hours",
    "total_minutes",
    "total_seconds",
    "total_milliseconds",
]


class TimeExtractStep(BaseStep):
    name: Literal["timeextract"] = "timeextract"
    column: str
    time_info: list[TIME_INFO] = Field(default_factory=list)
    new_columns: list[ColumnName] = Field(default_factory=list)


class TimeExtractStepWithVariable(TimeExtractStep, StepWithVariablesMixin):
    ...
