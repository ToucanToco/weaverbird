from typing import List, Literal

from pydantic import BaseModel, Field, validator

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.validation import validate_unique_columns
from weaverbird.pipeline.types import ColumnName

AggregateFn = Literal[
    'avg',
    'sum',
    'min',
    'max',
    'count',
    'count distinct',
    'first',
    'last',
]


class Aggregation(BaseModel):
    column: str
    agg_function: AggregateFn

    @validator('column')
    def _validate_column(cls, value):
        assert value and len(value) > 0, "'column' cannot be empty"
        return value


class DissolveStep(BaseStep):
    name = Field('dissolve', const=True)
    groups: List[ColumnName]
    aggregations: List[Aggregation]
    include_nulls: bool = False

    @validator('groups')
    def _validate_groups(cls, values):
        assert len(values) > 0, "At least one group must be specified"
        return validate_unique_columns(values)

    @validator('aggregations')
    def _validate_aggregations(cls, values):
        assert len(values) > 0, "At least one aggregation must be specified"
        return values
