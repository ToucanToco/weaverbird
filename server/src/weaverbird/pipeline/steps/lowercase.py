from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class LowercaseStep(BaseStep):
    name: Literal["lowercase"] = "lowercase"
    column: ColumnName
