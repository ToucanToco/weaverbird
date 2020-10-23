from abc import ABC, abstractmethod
from typing import Any, List, Literal, Union

from pandas import DataFrame, Series
from pydantic import Field
from pydantic.main import BaseModel

from weaverbird.steps.base import BaseStep

ColumnName = Union[str, int, float]
# DataValue = Union[bool, float, int, str, list, None]
DataValue = Any  # FIXME use Any to prevent pydantic cast


class BaseSimpleCondition(BaseModel, ABC):
    column: ColumnName
    # TODO support all operators (missing in, nin, matches, matches, null, notnull)

    @abstractmethod
    def filter(self, df: DataFrame) -> Series:
        ...


class ComparisonCondition(BaseSimpleCondition):
    operator: Literal['eq', 'ne', 'lt', 'le', 'gt', 'ge']
    value: DataValue

    def filter(self, df: DataFrame) -> Series:
        return getattr(df[self.column], self.operator)(self.value)


class InCondition(BaseSimpleCondition):
    operator: Literal['in']
    value: List[DataValue]

    def filter(self, df: DataFrame) -> Series:
        return df[self.column].isin(self.value)


class NotInCondition(BaseSimpleCondition):
    operator: Literal['nin']
    value: List[DataValue]

    def filter(self, df: DataFrame) -> Series:
        return ~df[self.column].isin(self.value)


SimpleCondition = Union[ComparisonCondition, InCondition, NotInCondition]


class FilterStep(BaseStep):
    name = Field('filter', const=True)
    # TODO support and/or nesting
    condition: SimpleCondition

    def execute(self, df: DataFrame, domain_retriever) -> DataFrame:
        return df[self.condition.filter(df)]
