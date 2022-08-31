from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import TemplatedVariable

EVOLUTION_TYPE = Literal["vsLastYear", "vsLastMonth", "vsLastWeek", "vsLastDay"]
EVOLUTION_FORMAT = Literal["abs", "pct"]


class EvolutionStep(BaseStep):
    name: Literal["evolution"] = "evolution"
    date_col: str = Field(alias="dateCol")
    value_col: str = Field(alias="valueCol")
    evolution_type: EVOLUTION_TYPE = Field(alias="evolutionType")
    evolution_format: EVOLUTION_FORMAT = Field(alias="evolutionFormat")
    index_columns: list[str] = Field([], alias="indexColumns")
    new_column: str | None = Field(alias="newColumn")


class EvolutionStepWithVariable(EvolutionStep, StepWithVariablesMixin):
    index_columns: TemplatedVariable | list[TemplatedVariable] = Field([], alias="indexColumns")
