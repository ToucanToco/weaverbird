from typing import Literal

from pydantic import BaseModel, Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName

DUMB_GROUPBY_COLUMN_NAME = "__dumb_groupby_column_name__"

Statistics = Literal["count", "max", "min", "average", "variance", "standard deviation"]


class Quantile(BaseModel):
    label: str | None
    nth: int
    order: int


class StatisticsStep(BaseStep):
    name: Literal["statistics"] = "statistics"
    column: ColumnName
    groupby_columns: list[ColumnName] = Field([], alias="groupbyColumns")
    statistics: list[Statistics]
    # Array of quantiles. Examples:
    # - median is 1rst quantile of order 2
    # - last decile is 9th quantile of order 10
    quantiles: list[Quantile]
