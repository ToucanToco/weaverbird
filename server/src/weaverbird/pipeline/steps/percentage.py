from typing import List, Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class PercentageStep(BaseStep):
    name: Literal['percentage'] = 'percentage'
    column: ColumnName
    group: List[ColumnName] = Field(default=[])
    new_column_name: ColumnName = Field(alias='newColumnName', default=None)
