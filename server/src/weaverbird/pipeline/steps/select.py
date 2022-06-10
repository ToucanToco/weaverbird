from typing import List, Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class SelectStep(BaseStep):
    name: Literal['select'] = 'select'
    columns: List[ColumnName] = Field(min_items=1)
