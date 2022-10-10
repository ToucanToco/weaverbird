from datetime import datetime

from numpy.ma import logical_and, logical_or
from pandas import DataFrame, Series, Timestamp
from pandas import to_datetime as pd_to_datetime
from pandas.tseries.offsets import DateOffset

from weaverbird.backends.pandas_executor.steps.utils.dates import evaluate_relative_date
from weaverbird.pipeline.conditions import (
    ComparisonCondition,
    Condition,
    ConditionComboAnd,
    ConditionComboOr,
    DateBoundCondition,
    InclusionCondition,
    MatchCondition,
    NullCondition,
)
from weaverbird.pipeline.dates import RelativeDate


def _date_bound_condition_to_tz_aware_timestamp(value: str | RelativeDate | datetime) -> Timestamp:
    if isinstance(value, RelativeDate):
        value = evaluate_relative_date(value)
    if isinstance(value, datetime):
        tz = value.tzinfo or "UTC"
        # Cannot pass a tz-aware datetime object with tz arg
        return Timestamp(value.replace(tzinfo=None), tz=tz)
    else:  # str
        ts = Timestamp(value)
        return ts if ts.tzinfo else ts.replace(tz="UTC")


def apply_condition(condition: Condition, df: DataFrame) -> Series:
    """
    Returns a boolean Series, that will be used to filter a DataFrame.

    Example:
        filter = apply_condition(condition, df)
        df[filter]  # The filtered DataFrame
    """
    if isinstance(condition, ComparisonCondition):
        return getattr(df[condition.column], condition.operator)(condition.value)
    elif isinstance(condition, InclusionCondition):
        f = df[condition.column].isin(condition.value)
        if condition.operator.startswith("n"):
            return ~f
        else:
            return f
    elif isinstance(condition, NullCondition):
        f = df[condition.column].isnull()
        if condition.operator.startswith("not"):
            return ~f
        else:
            return f
    elif isinstance(condition, MatchCondition):
        # We must ensure that the column does not contain pd.NA, as we must return only boolean
        # values
        f = df[condition.column].notnull() & df[condition.column].str.contains(condition.value)
        if condition.operator.startswith("not"):
            return ~f
        else:
            return f

    elif isinstance(condition, DateBoundCondition):
        if condition.operator == "until":
            comparison_method = "le"
        elif condition.operator == "from":
            comparison_method = "ge"
        else:
            raise NotImplementedError

        value = _date_bound_condition_to_tz_aware_timestamp(condition.value)

        # Remove time info from the column to filter on. Using utc=True to ensure we have time-aware
        # objects. Since we're only using this for comparison, the input column is not modified,
        column_without_time = pd_to_datetime(df[condition.column], utc=True) - DateOffset(
            hour=0, minute=0, second=0, microsecond=0, nanosecond=0
        )
        # Do the same with the value to compare it to
        value_without_time = value - DateOffset(
            hour=0, minute=0, second=0, microsecond=0, nanosecond=0
        )

        return getattr(column_without_time, comparison_method)(value_without_time)

    elif isinstance(condition, ConditionComboAnd):
        return logical_and.reduce([apply_condition(c, df) for c in condition.and_])
    elif isinstance(condition, ConditionComboOr):
        return logical_or.reduce([apply_condition(c, df) for c in condition.or_])
    else:
        raise NotImplementedError
