from typing import Literal, Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName

BASIC_DATE_PARTS = Literal[
    "year",
    "month",
    "day",
    "week",
    "quarter",
    "dayOfWeek",
    "dayOfYear",
    "isoYear",
    "isoWeek",
    "isoDayOfWeek",
    "hour",
    "minutes",
    "seconds",
    "milliseconds",
]

DATE_INFO = Union[
    BASIC_DATE_PARTS,
    Literal[
        "firstDayOfYear",
        "firstDayOfMonth",
        "firstDayOfWeek",
        "firstDayOfQuarter",
        "firstDayOfIsoWeek",
        "previousDay",
        "firstDayOfPreviousYear",
        "firstDayOfPreviousMonth",
        "firstDayOfPreviousWeek",
        "firstDayOfPreviousQuarter",
        "firstDayOfPreviousIsoWeek",
        "previousYear",
        "previousMonth",
        "previousWeek",
        "previousQuarter",
        "previousIsoWeek",
    ],
]


class DateExtractStep(BaseStep):
    name: Literal["dateextract"] = "dateextract"
    column: str
    date_info: list[DATE_INFO] = Field([], alias=("dateInfo"))
    new_columns: list[ColumnName] = Field([], alias="newColumns")
    operation: BASIC_DATE_PARTS | None
    new_column_name: ColumnName | None


class DateExtractStepWithVariable(DateExtractStep, StepWithVariablesMixin):
    ...
