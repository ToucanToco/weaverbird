from typing import List, Literal

from pydantic import Field, validator

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
    'count distinct including empty',
]


class DissolveStep(BaseStep):
    name = Field('dissolve', const=True)
    groups: List[ColumnName]
    agg_function: AggregateFn

    @validator('groups')
    def _validate_groups(cls, values):
        assert len(values) > 0, "At least one group must be specified"
        return validate_unique_columns(values)
