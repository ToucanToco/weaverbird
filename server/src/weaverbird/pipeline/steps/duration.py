from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable

_SECOND = 1
_MINUTE = _SECOND * 60
_HOUR = _MINUTE * 60
_DAY = _HOUR * 24

DURATIONS_IN_SECOND = {"seconds": _SECOND, "minutes": _MINUTE, "hours": _HOUR, "days": _DAY}


class DurationStep(BaseStep):
    name: Literal["duration"] = "duration"
    new_column_name: ColumnName
    start_date_column: ColumnName
    end_date_column: ColumnName
    duration_in: Literal["seconds", "minutes", "hours", "days"]


class DurationStepWithVariable(DurationStep, StepWithVariablesMixin):
    duration_in: TemplatedVariable
