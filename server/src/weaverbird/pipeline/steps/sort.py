from typing import Literal

from pydantic import BaseModel

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class ColumnSort(BaseModel):
    column: ColumnName
    order: Literal["asc", "desc"]


class SortStep(BaseStep):
    name: Literal["sort"] = "sort"
    columns: list[ColumnSort]
