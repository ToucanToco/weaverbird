from typing import List, Literal

from pydantic import BaseModel, Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName, PopulatedWithFieldnames


class ColumnSort(BaseModel):
    class Config(PopulatedWithFieldnames):
        ...

    column: ColumnName
    order: Literal['asc', 'desc']


class SortStep(BaseStep):
    name = Field('sort', const=True)
    columns: List[ColumnSort]
