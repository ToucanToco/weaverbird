from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class ToTimeNumberStep(BaseStep):
    name: Literal["totimenumber"] = "totimenumber"
    column: ColumnName
    unit: Literal["days", "hours", "minutes", "seconds", "milliseconds"]
