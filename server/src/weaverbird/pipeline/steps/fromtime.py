from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class FromtimeStep(BaseStep):
    name: Literal["fromtime"] = "fromtime"
    column: ColumnName
    format: str
