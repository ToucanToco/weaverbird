from weaverbird.backends.mongo_translator.steps.types import MongoStep
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
from weaverbird.pipeline.steps import FilterStep

operator_mapping = {
    "eq": "$eq",
    "ne": "$ne",
    "lt": "$lt",
    "le": "$lte",
    "gt": "$gt",
    "ge": "$gte",
    "in": "$in",
    "nin": "$nin",
    "isnull": "$eq",
    "notnull": "$ne",
    "from": "$gte",
    "until": "$lte",
}

RELATIVE_DATE_OPERATORS: dict[str, int] = {"until": -1, "from": +1}


def translate_relative_date(value: RelativeDate):
    sign = RELATIVE_DATE_OPERATORS[value.operator]
    return {
        "$dateAdd": {
            "startDate": truncate_to_day({"$toDate": value.date}),
            "amount": sign * abs(int(value.quantity)),
            "unit": value.duration,
        },
    }


def truncate_to_day(value):
    return {
        "$dateTrunc": {
            "date": value,
            "unit": "day",
        }
    }


def build_match_tree(condition: Condition, parent_operator="and") -> dict:
    # coumpound conditions

    if isinstance(condition, ConditionComboAnd):
        return {"$and": [build_match_tree(c, "and") for c in condition.and_]}
    elif isinstance(condition, ConditionComboOr):
        return {"$or": [build_match_tree(c, "or") for c in condition.or_]}

    # simple conditions
    elif isinstance(condition, ComparisonCondition) or isinstance(condition, InclusionCondition):
        return {condition.column: {operator_mapping[condition.operator]: condition.value}}
    elif isinstance(condition, NullCondition):
        return {condition.column: {operator_mapping[condition.operator]: None}}

    elif isinstance(condition, MatchCondition):
        if condition.operator == "matches":
            return {condition.column: {"$regex": condition.value}}
        elif condition.operator == "notmatches":
            return {condition.column: {"$not": {"$regex": condition.value}}}

    # dates
    elif isinstance(condition, DateBoundCondition):
        if isinstance(condition.value, RelativeDate):
            target_date = translate_relative_date(condition.value)
        else:
            target_date = {"$toDate": condition.value}

        return {
            "$expr": {
                operator_mapping[condition.operator]: [
                    truncate_to_day(f"${condition.column}"),
                    truncate_to_day(target_date),
                ]
            }
        }


def translate_filter(step: FilterStep) -> list[MongoStep]:
    return [{"$match": build_match_tree(step.condition)}]
