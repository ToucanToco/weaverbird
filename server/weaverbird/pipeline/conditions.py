from abc import ABC
from typing import Any, List, Literal, Union

from pydantic import BaseModel, Field

from weaverbird.pipeline.types import ColumnName, PopulatedWithFieldnames


class BaseCondition(BaseModel):
    ...


class ComparisonCondition(BaseCondition):
    column: ColumnName
    operator: Literal['eq', 'ne', 'lt', 'le', 'gt', 'ge']
    value: Any


class InclusionCondition(BaseCondition):
    column: ColumnName
    operator: Literal['in', 'nin']
    value: List[Any]


class NullCondition(BaseCondition):
    column: ColumnName
    operator: Literal['isnull', 'notnull']


class MatchCondition(BaseCondition):
    column: ColumnName
    operator: Literal['matches', 'notmatches']
    value: str


SimpleCondition = Union[ComparisonCondition, InclusionCondition, NullCondition, MatchCondition]


class BaseConditionCombo(BaseCondition, ABC):
    class Config(PopulatedWithFieldnames):
        ...

    def to_dict(self):
        return self.dict(by_alias=True)


class ConditionComboAnd(BaseConditionCombo):
    and_: List['Condition'] = Field(..., alias='and')


class ConditionComboOr(BaseConditionCombo):
    or_: List['Condition'] = Field(..., alias='or')


Condition = Union[ConditionComboAnd, ConditionComboOr, SimpleCondition]
ConditionComboOr.update_forward_refs()
ConditionComboAnd.update_forward_refs()
