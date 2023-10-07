from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class ToDurationTextStep(BaseStep):
    name: Literal["todurationtext"] = "todurationtext"
    column: ColumnName
    format: str
