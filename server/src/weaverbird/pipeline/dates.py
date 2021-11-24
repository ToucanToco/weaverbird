from datetime import datetime
from typing import Literal, Optional, Union

from pydantic import BaseModel


class RelativeDate(BaseModel):
    date: Optional[Union[datetime, str]]
    operator: Literal['from', 'until', 'before', 'after']
    quantity: int
    duration: Literal['year', 'quarter', 'month', 'week', 'day']
