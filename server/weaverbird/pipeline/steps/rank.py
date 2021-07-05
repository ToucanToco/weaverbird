from typing import List, Literal, Optional, Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class RankStep(BaseStep):
    name = Field('rank', const=True)
    value_col: ColumnName = Field(alias='valueCol')
    order: Literal['asc', 'desc']
    method: Literal['standard', 'dense']
    groupby: List[ColumnName] = []
    new_column_name: Optional[ColumnName] = Field(None, alias='newColumnName')


class RankStepWithVariable(RankStep, StepWithVariablesMixin):
    groupby: Union[TemplatedVariable, List[TemplatedVariable]]
