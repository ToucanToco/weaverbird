from datetime import datetime

from weaverbird.backends.pandas_executor.steps.utils.dates import evaluate_relative_date
from weaverbird.pipeline.dates import RelativeDate


def test_evaluate_relative_date():
    assert (
        evaluate_relative_date(
            RelativeDate(
                date=datetime(year=2020, month=8, day=1),
                operator='until',
                quantity=3,
                duration='month',
            )
        )
        == datetime(year=2020, month=5, day=1)
    )

    assert evaluate_relative_date(
        RelativeDate(
            date=datetime(year=2020, month=8, day=1), operator='from', quantity=3, duration='day'
        )
    ) == datetime(year=2020, month=8, day=4)
