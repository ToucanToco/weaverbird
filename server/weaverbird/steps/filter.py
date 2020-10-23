from typing import Literal, Union

from pandas import DataFrame
from pydantic import Field
from pydantic.main import BaseModel

from weaverbird.steps.base import BaseStep

ColumnName = Union[str, int, float]
DataValue = Union[bool, float, int, str, list, None]


class SimpleCondition(BaseModel):
    column: ColumnName
    # TODO support all operators
    operator: Literal['eq']
    value: DataValue


class FilterStep(BaseStep):
    name = Field('filter', const=True)
    # TODO support and/or nesting
    condition: SimpleCondition

    def execute(self, df: DataFrame, domain_retriever) -> DataFrame:
        return df[df[self.condition.column] == self.condition.value]
