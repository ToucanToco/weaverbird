from datetime import datetime
from typing import Literal, Optional, Union

from pydantic import BaseModel


class RelativeDate(BaseModel):
    date: Optional[Union[datetime, str]]
    duration: Literal['year', 'quarter', 'month', 'week', 'day']
    quantity: int
