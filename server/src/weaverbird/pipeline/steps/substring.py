from typing import Literal, Optional

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class SubstringStep(BaseStep):
    name: Literal['substring'] = 'substring'
    column: ColumnName
    new_column_name: Optional[ColumnName] = Field(alias='newColumnName')
    start_index: int
    end_index: int
