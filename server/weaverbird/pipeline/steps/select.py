from typing import List

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class SelectStep(BaseStep):
    name = Field('select', const=True)
    columns: List[ColumnName] = Field(min_items=1)
