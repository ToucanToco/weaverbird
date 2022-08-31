from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class CompareTextStep(BaseStep):
    name: Literal["comparetext"] = "comparetext"
    new_column_name: ColumnName = Field(alias="newColumnName")
    str_col_1: ColumnName = Field(alias="strCol1")
    str_col_2: ColumnName = Field(alias="strCol2")


class CompareTextStepWithVariables(CompareTextStep, StepWithVariablesMixin):
    str_col_1: TemplatedVariable = Field(alias="strCol1")
    str_col_2: TemplatedVariable = Field(alias="strCol2")
