from collections.abc import Callable
from datetime import datetime
from typing import Any, Literal

from dateutil.parser import parse as parse_dt
from pydantic import BaseModel, field_validator


class BaseRelativeDate(BaseModel):
    operator: Literal["from", "until", "before", "after"]
    quantity: int
    duration: Literal["year", "quarter", "month", "week", "day"]


class RelativeDate(BaseRelativeDate):
    date: datetime | None = None

    @field_validator("date", mode="before")
    @classmethod
    def _convert_date_to_datetime(cls, value: Any) -> Any:
        if isinstance(value, str):
            try:
                return parse_dt(value)
            except Exception as exc:
                raise ValueError(f"Invalid value provided: {value}") from exc
        return value


class RelativeDateWithVariables(BaseRelativeDate):
    date: datetime | str | None = None

    def render(self, variables: dict[str, Any], renderer: Callable[[Any, Any], Any]) -> RelativeDate:
        step_as_dict = self.model_dump()
        rendered_dict = renderer(step_as_dict, variables)
        return RelativeDate(**rendered_dict)
