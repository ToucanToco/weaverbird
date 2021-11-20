from typing import List, Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class ConvertStep(BaseStep):
    name = Field('convert', const=True)
    columns: List[ColumnName]
    data_type: Literal['integer', 'float', 'text', 'date', 'boolean']
