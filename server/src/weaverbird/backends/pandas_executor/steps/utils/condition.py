from numpy.ma import logical_and, logical_or
from pandas import DataFrame, Series

from weaverbird.pipeline.conditions import (
    ComparisonCondition,
    Condition,
    ConditionComboAnd,
    ConditionComboOr,
    InclusionCondition,
    MatchCondition,
    NullCondition,
)


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
        if condition.operator.startswith('n'):
            return ~f
        else:
            return f
    elif isinstance(condition, NullCondition):
        f = df[condition.column].isnull()
        if condition.operator.startswith('not'):
            return ~f
        else:
            return f
    elif isinstance(condition, MatchCondition):
        f = df[condition.column].str.contains(condition.value)
        if condition.operator.startswith('not'):
            return ~f
        else:
            return f
    elif isinstance(condition, ConditionComboAnd):
        return logical_and.reduce([apply_condition(c, df) for c in condition.and_])
    elif isinstance(condition, ConditionComboOr):
        return logical_or.reduce([apply_condition(c, df) for c in condition.or_])
    else:
        raise NotImplementedError
