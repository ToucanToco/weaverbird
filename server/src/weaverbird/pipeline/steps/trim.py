from typing import List, Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class TrimStep(BaseStep):
    name: Literal['trim'] = 'trim'
    columns: List[ColumnName]
