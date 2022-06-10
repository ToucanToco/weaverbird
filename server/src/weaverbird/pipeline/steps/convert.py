from typing import List, Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class ConvertStep(BaseStep):
    name: Literal['convert'] = 'convert'
    columns: List[ColumnName]
    data_type: Literal['integer', 'float', 'text', 'date', 'boolean']
