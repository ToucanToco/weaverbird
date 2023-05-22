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

FIRST_DAY_DATE_PARTS = Literal[
    "previousDay",
    "firstDayOfYear",
    "firstDayOfMonth",
    "firstDayOfWeek",
    "firstDayOfQuarter",
    "firstDayOfIsoWeek",
    "firstDayOfPreviousYear",
    "firstDayOfPreviousMonth",
    "firstDayOfPreviousWeek",
    "firstDayOfPreviousQuarter",
    "firstDayOfPreviousIsoWeek",
]

DATE_INFO = Union[
    BASIC_DATE_PARTS,
    FIRST_DAY_DATE_PARTS,
    Literal[
        "previousYear",
        "previousMonth",
        "previousWeek",
        "previousQuarter",
        "previousIsoWeek",
    ],
]

DATE_UNIT_WITH_INT_CAST_NOT_NEEDED: list[str] = [
    "firstdayofpreviousisoweek",
    "firstdayofpreviousweek",
    "firstdayofpreviousquarter",
    "firstdayofpreviousmonth",
    "firstdayofpreviousyear",
    "firstdayofquarter",
    "firstdayofisoweek",
    "firstdayofweek",
    "firstdayofmonth",
    "firstdayofyear",
    "previousday",
]


class DateExtractStep(BaseStep):
    name: Literal["dateextract"] = "dateextract"
    column: str
    date_info: list[DATE_INFO] = Field(default_factory=list)
    new_columns: list[ColumnName] = Field(default_factory=list)
    operation: BASIC_DATE_PARTS | None
    new_column_name: ColumnName | None


class DateExtractStepWithVariable(DateExtractStep, StepWithVariablesMixin):
    ...
