from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class MovingAverageStep(BaseStep):
    name: Literal["movingaverage"] = "movingaverage"

    value_column: ColumnName | None = Field(None, alias="valueColumn")
    column_to_sort: ColumnName = Field(alias="columnToSort")
    moving_window: int = Field(alias="movingWindow")
    groups: list[ColumnName] = []
    new_column_name: ColumnName | None = Field(alias="newColumnName")
