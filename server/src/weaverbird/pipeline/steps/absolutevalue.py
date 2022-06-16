from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class AbsoluteValueStep(BaseStep):
    name: Literal['absolutevalue'] = 'absolutevalue'
    column: ColumnName
    new_column: ColumnName
