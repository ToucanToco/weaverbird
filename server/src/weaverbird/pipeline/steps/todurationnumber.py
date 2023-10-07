from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class ToDurationNumberStep(BaseStep):
    name: Literal["todurationnumber"] = "todurationnumber"
    column: ColumnName
    unit: Literal["days", "hours", "minutes", "seconds", "milliseconds"]
