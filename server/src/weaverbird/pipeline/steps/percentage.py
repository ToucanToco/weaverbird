from typing import List

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class PercentageStep(BaseStep):
    name = Field('percentage', const=True)
    column: ColumnName
    group: List[ColumnName] = Field(default=[])
    new_column_name: ColumnName = Field(alias='newColumnName', default=None)
