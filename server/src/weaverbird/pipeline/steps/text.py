from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName


class TextStep(BaseStep):
    name: Literal["text"] = "text"
    text: str
    new_column: ColumnName


class TextStepWithVariable(TextStep, StepWithVariablesMixin):
    ...
