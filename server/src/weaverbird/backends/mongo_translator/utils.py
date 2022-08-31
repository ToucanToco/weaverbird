import datetime
from re import sub
from typing import Any

from weaverbird.backends.mongo_translator.steps.filter import (
    translate_relative_date,
    truncate_to_day,
)
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.conditions import (
    ConditionComboAnd,
    ConditionComboOr,
    MatchCondition,
    SimpleCondition,
)
from weaverbird.pipeline.dates import RelativeDate


def column_to_user_variable(col_name: str) -> str:
    """User variable names can contain the ascii characters [_a-zA-Z0-9] and any non-ascii character."""
    col_name_without_invalid_chars = sub(r"/[^_a-zA-Z0-9]/g", "_", col_name)
    return f"vqb_{col_name_without_invalid_chars}"


class UnsupportedOperatorError(Exception):
    """Raised when condition uses an unsupported operator"""


def build_cond_expression(
    cond: SimpleCondition | ConditionComboOr | ConditionComboAnd,
) -> MongoStep:
    operator_mapping = {
        "eq": "$eq",
        "ne": "$ne",
        "lt": "$lt",
        "le": "$lte",
        "gt": "$gt",
        "ge": "$gte",
        "in": "$in",
        "nin": "$in",
        "isnull": "$eq",
        "notnull": "$ne",
        "matches": "$regexMatch",
        "notmatches": "$regexMatch",
        "from": "$gte",
        "until": "$lte",
    }
    unsupported_operators: list = []

    if isinstance(cond, ConditionComboAnd):
        return build_and_expression(cond)
    if isinstance(cond, ConditionComboOr):
        return {"$and": [build_cond_expression(elem) for elem in cond.or_]}
    if cond.operator in unsupported_operators:
        raise UnsupportedOperatorError(f"Unsupported operator ${cond.operator} in conditions")

    if cond.operator == "matches" or cond.operator == "notmatches":
        cond_expression = build_matches_expression(cond)
        return cond_expression

    else:
        if cond.operator == "notnull" or cond.operator == "isnull":
            return {operator_mapping[cond.operator]: [f"${cond.column}", None]}

        else:
            cond_expression = {operator_mapping[cond.operator]: [f"${cond.column}", cond.value]}
            if cond.operator == "nin":
                cond_expression = {"$not": cond_expression}

            cond_expression = build_dates_expressions(cond, cond_expression, operator_mapping)
            return cond_expression


def build_dates_expressions(
    cond: SimpleCondition, cond_expression: dict[str, Any], operator_mapping: dict[str, str]
):
    if cond.operator == "until":
        if isinstance(cond.value, datetime.datetime):
            cond_expression[operator_mapping[cond.operator]][1] = [
                datetime.datetime(
                    day=cond.value.day, month=cond.value.month, year=cond.value.month
                ).replace(hour=23, minute=59, second=59, microsecond=999999)
            ]
    if cond.operator == "from" or cond.operator == "until":
        cond_expression = {
            operator_mapping[cond.operator]: [
                truncate_to_day(f"${cond.column}"),
                truncate_to_day(
                    translate_relative_date(cond.value)
                    if isinstance(cond.value, RelativeDate)
                    else cond.value
                ),
            ]
        }
    return cond_expression


def build_matches_expression(cond: MatchCondition):
    cond_expression: MongoStep = {"$regexMatch": {"input": f"${cond.column}", "regex": cond.value}}
    if cond.operator == "notmatches":
        cond_expression = {"$not": cond_expression}
    return cond_expression


def build_and_expression(cond: ConditionComboAnd):
    if len(cond.and_) == 1:
        return build_cond_expression(cond.and_[0])
    else:
        return {"$and": [build_cond_expression(elem) for elem in cond.and_]}
