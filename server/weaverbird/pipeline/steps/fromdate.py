from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class FromdateStep(BaseStep):
    name = Field('fromdate', const=True)
    column: ColumnName
    format: str
