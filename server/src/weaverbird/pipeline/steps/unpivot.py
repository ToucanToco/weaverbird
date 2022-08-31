from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class UnpivotStep(BaseStep):
    name: Literal["unpivot"] = "unpivot"
    keep: list[ColumnName]
    unpivot: list[ColumnName]
    unpivot_column_name: ColumnName
    value_column_name: ColumnName
    dropna: bool


class UnpivotStepWithVariable(UnpivotStep, StepWithVariablesMixin):
    keep: TemplatedVariable | list[TemplatedVariable]
    unpivot: TemplatedVariable | list[TemplatedVariable]
