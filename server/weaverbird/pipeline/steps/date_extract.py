from typing import List, Literal, Optional, Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName

BASIC_DATE_PARTS = Literal[
    'year',
    'month',
    'day',
    'week',
    'quarter',
    'dayOfWeek',
    'dayOfYear',
    'isoYear',
    'isoWeek',
    'isoDayOfWeek',
    'hour',
    'minutes',
    'seconds',
    'milliseconds',
]

DATE_INFO = Union[
    BASIC_DATE_PARTS,
    Literal[
        'firstDayOfYear',
        'firstDayOfMonth',
        'firstDayOfWeek',
        'firstDayOfQuarter',
        'firstDayOfIsoWeek',
        'previousDay',
        'firstDayOfPreviousYear',
        'firstDayOfPreviousMonth',
        'firstDayOfPreviousWeek',
        'firstDayOfPreviousQuarter',
        'firstDayOfPreviousIsoWeek',
        'previousYear',
        'previousMonth',
        'previousWeek',
        'previousQuarter',
        'previousIsoWeek',
    ],
]


class DateExtractStep(BaseStep):
    name = Field('dateextract', const=True)
    column: str
    date_info: List[DATE_INFO] = Field([], alias=('dateInfo'))
    new_columns: List[ColumnName] = Field([], alias='newColumns')
    operation: Optional[BASIC_DATE_PARTS]
    new_column_name: Optional[ColumnName]


class DateExtractStepWithVariable(DateExtractStep, StepWithVariablesMixin):
    ...
