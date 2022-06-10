from typing import List, Literal, Optional, Tuple, Union

from pydantic import Field, root_validator

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class CumSumStep(BaseStep):
    name: Literal['cumsum'] = 'cumsum'
    to_cumsum: List[Tuple[str, Optional[str]]] = Field(..., alias='toCumSum')
    reference_column: ColumnName = Field(..., alias='referenceColumn')
    groupby: Optional[List[ColumnName]]

    @root_validator(pre=True)
    def handle_legacy_syntax(cls, values):
        if 'valueColumn' in values:
            values['value_column'] = values.pop('valueColumn')
        if 'newColumn' in values:
            values['new_column'] = values.pop('newColumn')

        if 'value_column' in values:
            values['to_cumsum'] = [(values.pop('value_column'), values.pop('new_column', None))]
        return values


class CumSumStepWithVariable(CumSumStep, StepWithVariablesMixin):
    to_cumsum: Union[TemplatedVariable, List[Tuple[TemplatedVariable, TemplatedVariable]]] = Field(
        ..., alias='toCumSum'
    )
