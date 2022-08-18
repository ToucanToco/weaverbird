from typing import List, Literal, Union, Any

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import TemplatedVariable


class PivotStep(BaseStep):
    name: Literal['pivot'] = 'pivot'
    index: list[str]
    column_to_pivot: str
    value_column: str
    values: list[Any] | None
    agg_function: Literal['sum', 'avg', 'count', 'min', 'max']


class PivotStepWithVariable(PivotStep, StepWithVariablesMixin):
    index: Union[TemplatedVariable, List[TemplatedVariable]]
