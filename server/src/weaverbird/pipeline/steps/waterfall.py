from typing import Any, Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable

TYPE_WATERFALL_COLUMN = "TYPE_waterfall"
LABEL_WATERFALL_COLUMN = "LABEL_waterfall"
GROUP_WATERFALL_COLUMN = "GROUP_waterfall"

_RESULT_COLUMN = "result"


class WaterfallStep(BaseStep):
    name: Literal["waterfall"] = "waterfall"
    valueColumn: ColumnName
    milestonesColumn: ColumnName
    start: Any
    end: Any
    labelsColumn: ColumnName
    sortBy: Literal["value", "label"]
    order: Literal["desc", "asc"]
    parentsColumn: ColumnName | None
    groupby: list[ColumnName] = []


class WaterfallStepWithVariable(WaterfallStep, StepWithVariablesMixin):
    groupby: TemplatedVariable | list[TemplatedVariable]
