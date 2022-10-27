from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class CompareTextStep(BaseStep):
    name: Literal["comparetext"] = "comparetext"
    new_column_name: ColumnName
    str_col_1: ColumnName
    str_col_2: ColumnName


class CompareTextStepWithVariables(CompareTextStep, StepWithVariablesMixin):
    str_col_1: TemplatedVariable
    str_col_2: TemplatedVariable
