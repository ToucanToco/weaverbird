from abc import ABC
from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseConfig, BaseModel, Field

from weaverbird.pipeline.dates import RelativeDate
from weaverbird.pipeline.types import ColumnName


class BaseCondition(BaseModel):
    ...


class ComparisonCondition(BaseCondition):
    column: ColumnName
    operator: Literal["eq", "ne", "lt", "le", "gt", "ge"]
    value: Any


class InclusionCondition(BaseCondition):
    column: ColumnName
    operator: Literal["in", "nin"]
    value: list[Any]


class NullCondition(BaseCondition):
    column: ColumnName
    operator: Literal["isnull", "notnull"]


class MatchCondition(BaseCondition):
    column: ColumnName
    operator: Literal["matches", "notmatches"]
    value: str


class DateBoundCondition(BaseModel):
    column: ColumnName
    operator: Literal["from", "until"]
    value: RelativeDate | datetime | str


SimpleCondition = Annotated[
    ComparisonCondition | InclusionCondition | NullCondition | MatchCondition | DateBoundCondition,
    Field(discriminator="operator"),  # noqa: F821
]


class BaseConditionCombo(BaseCondition, ABC):
    class Config(BaseConfig):
        allow_population_by_field_name = True

    def to_dict(self):
        return self.dict(by_alias=True)


class ConditionComboAnd(BaseConditionCombo):
    and_: list["Condition"] = Field(..., alias="and")


class ConditionComboOr(BaseConditionCombo):
    or_: list["Condition"] = Field(..., alias="or")


Condition = ConditionComboAnd | ConditionComboOr | SimpleCondition
ConditionComboOr.update_forward_refs()
ConditionComboAnd.update_forward_refs()
