from typing import List, Literal, Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class AddMissingDatesStep(BaseStep):
    name = Field('addmissingdates', const=True)
    dates_column: ColumnName = Field(alias='datesColumn')
    dates_granularity: Union[
        Literal['day'], Literal['week'], Literal['month'], Literal['year']
    ] = Field(alias='datesGranularity')
    groups: List[ColumnName] = []


class AddMissingDatesStepWithVariables(AddMissingDatesStep, StepWithVariablesMixin):
    groups: Union[List[TemplatedVariable], TemplatedVariable]
    dates_column: TemplatedVariable = Field(alias='datesColumn')
