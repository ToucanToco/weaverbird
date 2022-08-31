from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class FromdateStep(BaseStep):
    name: Literal["fromdate"] = "fromdate"
    column: ColumnName
    format: str
