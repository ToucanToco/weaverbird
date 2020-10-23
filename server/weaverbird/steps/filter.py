from typing import Any, Literal, Union

from pandas import DataFrame, Series
from pydantic import Field
from pydantic.main import BaseModel

from weaverbird.steps.base import BaseStep

ColumnName = Union[str, int, float]
# DataValue = Union[bool, float, int, str, list, None]
DataValue = Any  # FIXME use Any to prevent pydantic cast


class SimpleCondition(BaseModel):
    column: ColumnName
    # TODO support all operators (missing in, nin, matches, matches, null, notnull)
    operator: Literal['eq', 'ne', 'lt', 'le', 'gt', 'ge']
    value: DataValue


class FilterStep(BaseStep):
    name = Field('filter', const=True)
    # TODO support and/or nesting
    condition: SimpleCondition

    def execute(self, df: DataFrame, domain_retriever) -> DataFrame:
        return df[binary_operator_filter(df, **self.condition.dict())]


BINARY_OPERATORS = ['eq', 'ne', 'lt', 'le', 'gt', 'ge']


def binary_operator_filter(
    df: DataFrame,
    operator: Literal['eq', 'ne', 'lt', 'le', 'gt', 'ge'],
    column: ColumnName,
    value: DataValue,
) -> Series:
    return getattr(df[column], operator)(value)
