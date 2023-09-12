from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class SubstringStep(BaseStep):
    name: Literal["substring"] = "substring"
    column: ColumnName
    new_column_name: ColumnName | None = None
    start_index: int
    end_index: int
