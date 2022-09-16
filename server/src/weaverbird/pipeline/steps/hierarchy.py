from typing import Literal

from pydantic import Field, validator

from weaverbird.pipeline.steps.utils.base import BaseStep, to_camelcase


class HierarchyStep(BaseStep):
    class Config:
        alias_generator = to_camelcase

    name: Literal["hierarchy"] = "hierarchy"
    hierarchy_level_column: str = Field(default="hierarchy_level")
    hierarchy: list[str]
    include_nulls: bool = Field(default=False)

    @validator("hierarchy")
    def _ensure_hierarchy(cls, values: list[str]) -> list[str]:
        assert len(values) > 0, "at least one value must be specified"
        return values
