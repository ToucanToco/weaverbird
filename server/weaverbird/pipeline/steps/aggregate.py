from typing import List, Literal, Optional, Sequence

from pydantic import Field, root_validator, validator
from pydantic.main import BaseModel

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.steps.utils.validation import validate_unique_columns
from weaverbird.pipeline.types import ColumnName, PopulatedWithFieldnames, TemplatedVariable

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


class Aggregation(BaseModel):
    class Config(PopulatedWithFieldnames):
        ...

    new_columns: List[ColumnName] = Field(alias='newcolumns')
    agg_function: AggregateFn = Field(alias='aggfunction')
    columns: List[ColumnName]

    @validator('columns', pre=True)
    def validate_unique_columns(cls, value):
        return validate_unique_columns(value)

    @root_validator(pre=True)
    def handle_legacy_syntax(cls, values):
        if 'column' in values:
            values['columns'] = [values.pop('column')]
        if 'newcolumn' in values:
            values['new_columns'] = [values.pop('newcolumn')]
        return values


class AggregateStep(BaseStep):
    name = Field('aggregate', const=True)
    on: List[ColumnName] = []
    aggregations: Sequence[Aggregation]
    keep_original_granularity: Optional[bool] = Field(
        default=False, alias='keepOriginalGranularity'
    )

    class Config(PopulatedWithFieldnames):
        ...


class AggregationWithVariables(Aggregation):
    class Config(PopulatedWithFieldnames):
        ...

    new_columns: List[TemplatedVariable] = Field(alias='newcolumns')
    agg_function: TemplatedVariable = Field(alias='aggfunction')
    columns: List[TemplatedVariable]


class AggregateStepWithVariables(AggregateStep, StepWithVariablesMixin):
    aggregations: Sequence[AggregationWithVariables]
