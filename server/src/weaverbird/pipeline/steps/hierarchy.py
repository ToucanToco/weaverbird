from typing import Literal

from pydantic import Field, validator

from weaverbird.pipeline.steps.utils.base import BaseStep


class HierarchyStep(BaseStep):
    name: Literal["hierarchy"] = "hierarchy"
    hierarchy_level_column: str = Field(default="hierarchy_level", alias="hierarchyLevelColumn")
    hierarchy: list[str]
    include_nulls: bool = Field(default=False, alias="includeNulls")

    @validator("hierarchy")
    def _ensure_hierarchy(cls, values: list[str]) -> list[str]:
        assert len(values) > 0, "at least one value must be specified"
        return values
