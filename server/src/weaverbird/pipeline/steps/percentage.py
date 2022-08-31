from typing import Literal

from pydantic import Field, validator

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class PercentageStep(BaseStep):
    name: Literal["percentage"] = "percentage"
    column: ColumnName
    group: list[ColumnName] = Field(default=[])
    new_column_name: ColumnName | None = Field(alias="newColumnName", default=None)

    @validator("new_column_name", always=True)
    def set_new_column_name_if_not_set(cls, v, values):
        if v is None:
            return f"{values['column']}_PCT"
        return v
