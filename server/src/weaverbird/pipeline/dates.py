from datetime import datetime
from typing import Any, Literal

from dateutil.parser import parse as parse_dt
from pydantic import BaseModel, field_validator


class RelativeDate(BaseModel):
    date: datetime | None = None
    operator: Literal["from", "until", "before", "after"]
    quantity: int
    duration: Literal["year", "quarter", "month", "week", "day"]

    @field_validator("date", mode="before")
    @classmethod
    def _convert_date_to_datetime(cls, value: Any) -> Any:
        if isinstance(value, str):
            try:
                return parse_dt(value)
            except Exception as exc:
                raise ValueError(f"Invalid value provided: {value}") from exc
        return value
