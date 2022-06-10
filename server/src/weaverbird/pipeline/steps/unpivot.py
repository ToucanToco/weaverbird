from typing import List, Literal, Union

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class UnpivotStep(BaseStep):
    name: Literal['unpivot'] = 'unpivot'
    keep: List[ColumnName]
    unpivot: List[ColumnName]
    unpivot_column_name: ColumnName
    value_column_name: ColumnName
    dropna: bool


class UnpivotStepWithVariable(UnpivotStep, StepWithVariablesMixin):
    keep: Union[TemplatedVariable, List[TemplatedVariable]]
    unpivot: Union[TemplatedVariable, List[TemplatedVariable]]
