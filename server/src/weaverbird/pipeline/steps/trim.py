from typing import List

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class TrimStep(BaseStep):
    name = Field('trim', const=True)
    columns: List[ColumnName]
