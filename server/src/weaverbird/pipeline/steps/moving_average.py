from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class MovingAverageStep(BaseStep):
    name: Literal["movingaverage"] = "movingaverage"

    value_column: ColumnName | None = None
    column_to_sort: ColumnName
    moving_window: int
    groups: list[ColumnName] = Field(default_factory=list)
    new_column_name: ColumnName | None = None
