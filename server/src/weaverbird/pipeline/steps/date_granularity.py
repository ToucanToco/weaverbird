from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName

DATE_GRANULARITY = Literal[
    "day",
    "isoWeek",
    "week",
    "month",
    "quarter",
    "year",
]


class DateGranularityStep(BaseStep):
    name: Literal["dategranularity"] = "dategranularity"
    granularity: DATE_GRANULARITY
    column: str
    new_column: ColumnName | None = None


class DateGranularityStepWithVariable(DateGranularityStep, StepWithVariablesMixin): ...
