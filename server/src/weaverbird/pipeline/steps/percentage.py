from typing import Literal

from pydantic import Field, model_validator

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class PercentageStep(BaseStep):
    name: Literal["percentage"] = "percentage"
    column: ColumnName
    group: list[ColumnName] = Field(default_factory=list)
    new_column_name: ColumnName | None = None

    @model_validator(mode="after")
    def set_new_column_name_if_not_set(self) -> "PercentageStep":
        if self.new_column_name is None:
            self.new_column_name = f"{self.column}_PCT"
        return self
