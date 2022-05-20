from typing import List, Literal, Optional

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class MovingAverageStep(BaseStep):
    name: Literal['movingaverage'] = 'movingaverage'

    value_column: Optional[ColumnName] = Field(None, alias='valueColumn')
    column_to_sort: ColumnName = Field(alias='columnToSort')
    moving_window: int = Field(alias='movingWindow')
    groups: List[ColumnName] = []
    new_column_name: Optional[ColumnName] = Field(alias='newColumnName')
