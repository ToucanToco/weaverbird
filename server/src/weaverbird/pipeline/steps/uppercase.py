from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class UppercaseStep(BaseStep):
    name = Field('uppercase', const=True)
    column: ColumnName
