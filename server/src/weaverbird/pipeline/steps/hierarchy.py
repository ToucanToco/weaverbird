from typing import Literal

from pydantic import validator

from weaverbird.pipeline.steps.utils.base import BaseStep


class HierarchyStep(BaseStep):
    name: Literal["hierarchy"] = "hierarchy"
    hierarchy_level_column: str = "hierarchy_level"
    hierarchy: list[str]
    include_nulls: bool = False

    @validator("hierarchy")
    def _ensure_hierarchy(cls, values: list[str]) -> list[str]:
        assert len(values) > 0, "at least one value must be specified"
        return values
