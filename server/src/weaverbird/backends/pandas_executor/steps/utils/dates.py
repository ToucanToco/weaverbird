import operator
from datetime import datetime

from dateutil.parser import parse as parse_dt
from dateutil.relativedelta import relativedelta

from weaverbird.pipeline.dates import RelativeDate


def evaluate_relative_date(relative_date: RelativeDate) -> datetime:
    """
    From a RelativeDate definition, compute the actual corresponding datetime.
    """
    if relative_date.operator == "until":
        operation = operator.sub
    elif relative_date.operator == "from":
        operation = operator.add
    else:
        raise NotImplementedError

    if relative_date.duration == "quarter":
        quantity = relative_date.quantity * 3
        duration = "months"
    else:
        quantity = relative_date.quantity
        duration = relative_date.duration + "s"

    as_dt = (
        relative_date.date
        if isinstance(relative_date.date, datetime)
        else parse_dt(relative_date.date)
    )
    return operation(as_dt, relativedelta(**{duration: quantity}))
