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

    @abstractmethod
    def filter(self, df: DataFrame) -> Series:
        """
        Returns a boolean Series, that will be used to filter a DataFrame.

        Example:
            filter = condition.filter(df)
            df[filter]  # The filtered DataFrame
        """


class ComparisonCondition(BaseSimpleCondition):
    operator: Literal['eq', 'ne', 'lt', 'le', 'gt', 'ge']
    value: DataValue

    def filter(self, df: DataFrame) -> Series:
        return getattr(df[self.column], self.operator)(self.value)


class InclusionCondition(BaseSimpleCondition):
    operator: Literal['in', 'nin']
    value: List[DataValue]

    def filter(self, df: DataFrame) -> Series:
        f = df[self.column].isin(self.value)
        if self.operator.startswith('n'):
            return ~f
        else:
            return f


class NullCondition(BaseSimpleCondition):
    operator: Literal['null', 'notnull']

    def filter(self, df: DataFrame) -> Series:
        f = df[self.column].isnull()
        if self.operator.startswith('not'):
            return ~f
        else:
            return f


class MatchCondition(BaseSimpleCondition):
    operator: Literal['matches', 'notmatches']
    value: str

    def filter(self, df: DataFrame) -> Series:
        f = df[self.column].str.contains(self.value)
        if self.operator.startswith('not'):
            return ~f
        else:
            return f


SimpleCondition = Union[ComparisonCondition, InclusionCondition, NullCondition, MatchCondition]


class FilterStep(BaseStep):
    name = Field('filter', const=True)
    # TODO support and/or nesting
    condition: SimpleCondition

    def execute(self, df: DataFrame, domain_retriever) -> DataFrame:
        return df[self.condition.filter(df)]
