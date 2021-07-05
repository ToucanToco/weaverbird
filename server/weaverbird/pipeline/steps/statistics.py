from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName, PopulatedWithFieldnames

DUMB_GROUPBY_COLUMN_NAME = '__dumb_groupby_column_name__'

Statistics = Literal['count', 'max', 'min', 'average', 'variance', 'standard deviation']


class Quantile(BaseModel):
    label: Optional[str]
    nth: int
    order: int


class StatisticsStep(BaseStep):
    class Config(PopulatedWithFieldnames):
        ...

    name = Field('statistics', const=True)
    column: ColumnName
    groupby_columns: List[ColumnName] = Field([], alias='groupbyColumns')
    statistics: List[Statistics]
    # Array of quantiles. Examples:
    # - median is 1rst quantile of order 2
    # - last decile is 9th quantile of order 10
    quantiles: List[Quantile]
