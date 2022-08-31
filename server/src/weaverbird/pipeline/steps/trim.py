from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class TrimStep(BaseStep):
    name: Literal["trim"] = "trim"
    columns: list[ColumnName]
