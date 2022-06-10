from typing import Literal, Optional

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class ToDateStep(BaseStep):
    name: Literal['todate'] = 'todate'
    column: ColumnName
    format: Optional[str]
