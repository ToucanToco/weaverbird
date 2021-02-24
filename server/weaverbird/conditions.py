from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, List, Literal, Union

from numpy.ma import logical_and, logical_or
from pandas import DataFrame, Series, to_datetime
from pydantic import BaseModel, Field, validator

from weaverbird.types import ColumnName, PopulatedWithFieldnames


class BaseCondition(BaseModel, ABC):
    @abstractmethod
    def filter(self, df: DataFrame) -> Series:
        """
        Returns a boolean Series, that will be used to filter a DataFrame.

        Example:
            filter = condition.filter(df)
            df[filter]  # The filtered DataFrame
        """


class ComparisonCondition(BaseCondition):
    column: ColumnName
    operator: Literal['eq', 'ne', 'lt', 'le', 'gt', 'ge']
    value: Any

    @validator('value')
    def value_must_have_compatible_type_pandas(cls, v):
        print(f'validating value {cls=} {v=} ')
        if isinstance(v, datetime):
            print(f'converting {v} to pandas datetime')
            return to_datetime(v.replace(tzinfo=None), utc=False)
        return v

    def filter(self, df: DataFrame) -> Series:
        return getattr(df[self.column], self.operator)(self.value)


class InclusionCondition(BaseCondition):
    column: ColumnName
    operator: Literal['in', 'nin']
    value: List[Any]

    def filter(self, df: DataFrame) -> Series:
        f = df[self.column].isin(self.value)
        if self.operator.startswith('n'):
            return ~f
        else:
            return f


class NullCondition(BaseCondition):
    column: ColumnName
    operator: Literal['isnull', 'notnull']

    def filter(self, df: DataFrame) -> Series:
        f = df[self.column].isnull()
        if self.operator.startswith('not'):
            return ~f
        else:
            return f


class MatchCondition(BaseCondition):
    column: ColumnName
    operator: Literal['matches', 'notmatches']
    value: str

    def filter(self, df: DataFrame) -> Series:
        f = df[self.column].str.contains(self.value)
        if self.operator.startswith('not'):
            return ~f
        else:
            return f


SimpleCondition = Union[ComparisonCondition, InclusionCondition, NullCondition, MatchCondition]


class BaseConditionCombo(BaseCondition, ABC):
    class Config(PopulatedWithFieldnames):
        ...

    def to_dict(self):
        return self.dict(by_alias=True)


class ConditionComboAnd(BaseConditionCombo):
    and_: List['Condition'] = Field(..., alias='and')

    def filter(self, df: DataFrame) -> Series:
        return logical_and.reduce([c.filter(df) for c in self.and_])


class ConditionComboOr(BaseConditionCombo):
    or_: List['Condition'] = Field(..., alias='or')

    def filter(self, df: DataFrame) -> Series:
        return logical_or.reduce([c.filter(df) for c in self.or_])


Condition = Union[ConditionComboAnd, ConditionComboOr, SimpleCondition]
ConditionComboOr.update_forward_refs()
ConditionComboAnd.update_forward_refs()
