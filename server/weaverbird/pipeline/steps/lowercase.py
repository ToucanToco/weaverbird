from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class LowercaseStep(BaseStep):
    name = Field('lowercase', const=True)
    column: ColumnName
