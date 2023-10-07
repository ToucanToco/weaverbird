from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class FromdurationStep(BaseStep):
    name: Literal["fromduration"] = "fromduration"
    column: ColumnName
    format: str
