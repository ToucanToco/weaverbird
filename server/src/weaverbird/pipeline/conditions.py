from abc import ABC
from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field

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
    value: str | int | float


class DateBoundCondition(BaseModel):
    column: ColumnName
    operator: Literal["from", "until"]
    value: RelativeDate | datetime | str


SimpleCondition = Annotated[
    ComparisonCondition | InclusionCondition | NullCondition | MatchCondition | DateBoundCondition,
    Field(discriminator="operator"),  # noqa: F821
]


class BaseConditionCombo(BaseCondition, ABC):
    model_config = ConfigDict(populate_by_name=True)

    def to_dict(self):
        return self.model_dump(by_alias=True)


class ConditionComboAnd(BaseConditionCombo):
    and_: list["Condition"] = Field(..., alias="and")


class ConditionComboOr(BaseConditionCombo):
    or_: list["Condition"] = Field(..., alias="or")


Condition = ConditionComboAnd | ConditionComboOr | SimpleCondition
ConditionComboOr.model_rebuild()
ConditionComboAnd.model_rebuild()
