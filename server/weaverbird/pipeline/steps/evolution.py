from typing import List, Literal, Optional, Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import TemplatedVariable

EVOLUTION_TYPE = Literal['vsLastYear', 'vsLastMonth', 'vsLastWeek', 'vsLastDay']
EVOLUTION_FORMAT = Literal['abs', 'pct']


class EvolutionStep(BaseStep):
    name = Field('evolution', const=True)
    date_col: str = Field(alias='dateCol')
    value_col: str = Field(alias='valueCol')
    evolution_type: EVOLUTION_TYPE = Field(alias='evolutionType')
    evolution_format: EVOLUTION_FORMAT = Field(alias='evolutionFormat')
    index_columns: List[str] = Field([], alias='indexColumns')
    new_column: Optional[str] = Field(alias='newColumn')


class EvolutionStepWithVariable(EvolutionStep, StepWithVariablesMixin):
    index_columns: Union[TemplatedVariable, List[TemplatedVariable]] = Field(
        [], alias='indexColumns'
    )
