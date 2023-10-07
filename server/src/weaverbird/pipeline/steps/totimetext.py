from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class ToTimeTextStep(BaseStep):
    name: Literal["totimetext"] = "totimetext"
    column: ColumnName
    format: str