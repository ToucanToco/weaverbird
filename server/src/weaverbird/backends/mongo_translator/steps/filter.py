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

operatorMapping = {
    'eq': '$eq',
    'ne': '$ne',
    'lt': '$lt',
    'le': '$lte',
    'gt': '$gt',
    'ge': '$gte',
    'in': '$in',
    'nin': '$nin',
    'isnull': '$eq',
    'notnull': '$ne',
    'from': '$gte',
    'until': '$lte',
}


def is_relative_date(value):
    return isinstance(value, RelativeDate)


def translate_relative_date(value: RelativeDate):
    RELATIVE_DATE_OPERATORS = {
        'until': {'label': 'until', 'sign': -1},
        'from': {'label': 'from', 'sign': +1},
    }
    operator = RELATIVE_DATE_OPERATORS[value.operator]
    return {
        '$dateAdd': {
            'startDate': {
                '$dateTrunc': {
                    'date': {'$toDate': value.date.timestamp()},
                    'unit': 'day',
                },
            },
            'amount': operator.sign * abs(value.quantity),
            'unit': value.duration,
        },
    }


def truncate_to_day(value):
    return {
        '$dateTrunc': {
            'date': value,
            'unit': 'day',
        }
    }


def build_match_tree(condition: Condition, parent_operator='and') -> dict:
    # coumpound conditions

    if isinstance(condition, ConditionComboAnd):
        return {'$and': [build_match_tree(c, 'and') for c in condition.and_]}
    elif isinstance(condition, ConditionComboOr):
        return {'$or': [build_match_tree(c, 'or') for c in condition.or_]}

    # simple conditions
    elif isinstance(condition, ComparisonCondition) or isinstance(condition, InclusionCondition):
        return {condition.column: {operatorMapping[condition.operator]: condition.value}}
    elif isinstance(condition, NullCondition):
        return {condition.column: {operatorMapping[condition.operator]: None}}

    elif isinstance(condition, MatchCondition):
        if condition.operator == 'matches':
            return {condition.column: {'$regex': condition.value}}
        elif condition.operator == 'notmatches':
            return {condition.column: {'$not': {'$regex': condition.value}}}

    elif isinstance(condition, DateBoundCondition):
        print(condition)
        target_date = (
            translate_relative_date(condition.value)
            if is_relative_date(condition.value)
            else {'$toDate': condition.value.timestamp()}
        )

        return {
            '$expr': {
                operatorMapping[condition.operator]: [
                    truncate_to_day(condition.column),
                    truncate_to_day(target_date),
                ]
            }
        }


def translate_filter(step: FilterStep) -> list:
    print(step)
    return [{'$match': build_match_tree(step.condition)}]
