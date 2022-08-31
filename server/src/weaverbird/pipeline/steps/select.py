from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class SelectStep(BaseStep):
    name: Literal["select"] = "select"
    columns: list[ColumnName] = Field(min_items=1)
