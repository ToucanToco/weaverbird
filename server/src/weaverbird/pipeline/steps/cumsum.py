from typing import List, Optional

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName


class CumSumStep(BaseStep):
    name = Field('cumsum', const=True)
    value_column: ColumnName = Field(..., alias='valueColumn')
    reference_column: ColumnName = Field(..., alias='referenceColumn')
    groupby: Optional[List[ColumnName]]
    new_column: Optional[ColumnName] = Field(None, alias='newColumn')


class CumSumStepWithVariable(CumSumStep, StepWithVariablesMixin):
    ...
