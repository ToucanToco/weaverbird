from typing import Any, List, Literal, Optional, Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable

TYPE_WATERFALL_COLUMN = 'TYPE_waterfall'
LABEL_WATERFALL_COLUMN = 'LABEL_waterfall'
GROUP_WATERFALL_COLUMN = 'GROUP_waterfall'

_RESULT_COLUMN = 'result'


class WaterfallStep(BaseStep):
    name = Field('waterfall', const=True)
    valueColumn: ColumnName
    milestonesColumn: ColumnName
    start: Any
    end: Any
    labelsColumn: ColumnName
    sortBy: Literal['value', 'label']
    order: Literal['desc', 'asc']
    parentsColumn: Optional[ColumnName]
    groupby: List[ColumnName] = []


class WaterfallStepWithVariable(WaterfallStep, StepWithVariablesMixin):
    groupby: Union[TemplatedVariable, List[TemplatedVariable]]
