from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName


class FormulaStep(BaseStep):
    name = Field('formula', const=True)
    new_column: ColumnName
    formula: str


class FormulaStepWithVariable(FormulaStep, StepWithVariablesMixin):
    ...
