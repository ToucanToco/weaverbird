from typing import List, Optional

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class MovingAverageStep(BaseStep):
    name = Field('movingaverage', const=True)

    value_column: Optional[ColumnName] = Field(None, alias='valueColumn')
    column_to_sort: ColumnName = Field(alias='columnToSort')
    moving_window: int = Field(alias='movingWindow')
    groups: List[ColumnName] = []
    new_column_name: Optional[ColumnName] = Field(alias='newColumnName')
