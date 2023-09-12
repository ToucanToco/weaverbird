from typing import Literal

from pydantic import Field, validator

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName


class PercentageStep(BaseStep):
    name: Literal["percentage"] = "percentage"
    column: ColumnName
    group: list[ColumnName] = Field(default_factory=list)
    new_column_name: ColumnName | None = None

    # TODO[pydantic]: We couldn't refactor the `validator`, please replace it by `field_validator` manually.
    # Check https://docs.pydantic.dev/dev-v2/migration/#changes-to-validators for more information.
    @validator("new_column_name", always=True)
    def set_new_column_name_if_not_set(cls, v, values):
        if v is None:
            return f"{values['column']}_PCT"
        return v
