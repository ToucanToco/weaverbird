from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class ReplaceTextStep(BaseStep):
    name: Literal["replacetext"] = "replacetext"
    search_column: ColumnName
    old_str: str
    new_str: str = Field(default="")


class ReplaceTextStepWithVariable(ReplaceTextStep, StepWithVariablesMixin):
    old_str: TemplatedVariable
