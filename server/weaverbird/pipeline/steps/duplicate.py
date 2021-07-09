from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class DuplicateStep(BaseStep):
    name = Field('duplicate', const=True)
    column: ColumnName
    new_column_name: ColumnName
