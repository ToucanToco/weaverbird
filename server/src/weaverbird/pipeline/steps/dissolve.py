from itertools import chain as ichain
from typing import Any, Literal

from pydantic import Field, validator

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.types import ColumnName

from .aggregate import Aggregation


class DissolveStep(BaseStep):
    name: Literal["dissolve"] = "dissolve"
    groups: list[ColumnName]
    aggregations: list[Aggregation] = []
    include_nulls: bool = Field(default=False, alias="includeNulls")

    @staticmethod
    def _ensure_unique_and_non_empty(values: list[Any], col_name: str) -> None:
        assert all(len(v) for v in values), f"all values in '{col_name}' must be non-empty"
        assert len(values) == len(set(values)), f"all values in '{col_name}' must be unique"

    @validator("groups")
    def _len_validator(cls, values: list) -> list:
        assert len(values) > 0, "list must contain at least one element"
        return values

    @validator("aggregations")
    def _validate_aggregations(cls, values: list[Aggregation]) -> list[Aggregation]:
        if len(values) < 1:
            return values

        for agg in values:
            assert len(agg.columns) == 1, "aggregations can only contain a single column"
            assert len(agg.new_columns) == 1, "aggregations can only contain a single new column"

        cls._ensure_unique_and_non_empty(
            list(ichain.from_iterable(agg.columns for agg in values)), "columns"
        )
        cls._ensure_unique_and_non_empty(
            list(ichain.from_iterable(agg.new_columns for agg in values)), "new_columns"
        )
        return values
