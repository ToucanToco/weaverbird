from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import TemplatedVariable

EVOLUTION_TYPE = Literal["vsLastYear", "vsLastMonth", "vsLastWeek", "vsLastDay"]
EVOLUTION_FORMAT = Literal["abs", "pct"]


class EvolutionStep(BaseStep):
    name: Literal["evolution"] = "evolution"
    date_col: str
    value_col: str
    evolution_type: EVOLUTION_TYPE
    evolution_format: EVOLUTION_FORMAT
    index_columns: list[str] = Field(default_factory=list)
    new_column: str | None = None


class EvolutionStepWithVariable(EvolutionStep, StepWithVariablesMixin):
    index_columns: TemplatedVariable | list[TemplatedVariable] = Field(default_factory=list)
