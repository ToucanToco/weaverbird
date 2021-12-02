import operator
from datetime import datetime

from dateutil.relativedelta import relativedelta

from weaverbird.pipeline.dates import RelativeDate


def evaluate_relative_date(relative_date: RelativeDate) -> datetime:
    """
    From a RelativeDate definition, compute the actual corresponding datetime.
    """
    if relative_date.operator == 'until':
        operation = operator.sub
    elif relative_date.operator == 'from':
        operation = operator.add
    else:
        raise NotImplementedError

    return operation(
        relative_date.date,
        relativedelta(**{relative_date.duration + 's': relative_date.quantity}),  # type: ignore
    )
