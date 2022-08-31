from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class UppercaseStep(BaseStep):
    name: Literal["uppercase"] = "uppercase"
    column: ColumnName
