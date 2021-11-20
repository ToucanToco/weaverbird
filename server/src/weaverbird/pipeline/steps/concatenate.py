from typing import List, Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class ConcatenateStep(BaseStep):
    name = Field('concatenate', const=True)
    columns: List[ColumnName] = Field(..., min_items=2)
    separator: str
    new_column_name: ColumnName


class ConcatenateStepWithVariable(ConcatenateStep, StepWithVariablesMixin):
    columns: Union[TemplatedVariable, List[TemplatedVariable]]
