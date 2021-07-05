from typing import Optional

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class ToDateStep(BaseStep):
    name = Field('todate', const=True)
    column: ColumnName
    format: Optional[str]
