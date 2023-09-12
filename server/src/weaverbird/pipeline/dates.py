from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class RelativeDate(BaseModel):
    date: datetime | str | None = None
    operator: Literal["from", "until", "before", "after"]
    quantity: int
    duration: Literal["year", "quarter", "month", "week", "day"]
