from typing import Optional

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class SubstringStep(BaseStep):
    name = Field('substring', const=True)
    column: ColumnName
    new_column_name: Optional[ColumnName] = Field(alias='newColumnName')
    start_index: int
    end_index: int
