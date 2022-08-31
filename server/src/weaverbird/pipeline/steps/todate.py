from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class ToDateStep(BaseStep):
    name: Literal["todate"] = "todate"
    column: ColumnName
    format: str | None
