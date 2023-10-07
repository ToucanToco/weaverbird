from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName

DURATION_INFO = Literal[
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


class DurationExtractStep(BaseStep):
    name: Literal["durationextract"] = "durationextract"
    column: str
    duration_info: list[DURATION_INFO] = Field(default_factory=list)
    new_columns: list[ColumnName] = Field(default_factory=list)


class DurationExtractStepWithVariable(DurationExtractStep, StepWithVariablesMixin):
    ...
