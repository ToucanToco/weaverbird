from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName


class FormulaStep(BaseStep):
    name: Literal["formula"] = "formula"
    new_column: ColumnName
    formula: str


class FormulaStepWithVariable(FormulaStep, StepWithVariablesMixin):
    ...
