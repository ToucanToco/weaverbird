from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import TemplatedVariable


class PivotStep(BaseStep):
    name: Literal["pivot"] = "pivot"
    index: list[str]
    column_to_pivot: str
    value_column: str
    agg_function: Literal["sum", "avg", "count", "min", "max"]


class PivotStepWithVariable(PivotStep, StepWithVariablesMixin):
    index: TemplatedVariable | list[TemplatedVariable]
