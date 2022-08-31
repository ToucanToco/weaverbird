from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class DuplicateStep(BaseStep):
    name: Literal["duplicate"] = "duplicate"
    column: ColumnName
    new_column_name: ColumnName
