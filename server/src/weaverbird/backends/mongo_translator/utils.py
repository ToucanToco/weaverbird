import datetime
from re import sub
from typing import List, Union

from weaverbird.backends.mongo_translator.steps.filter import (
    translate_relative_date,
    truncate_to_day,
)
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.conditions import ConditionComboAnd, ConditionComboOr, SimpleCondition
from weaverbird.pipeline.dates import RelativeDate


def column_to_user_variable(col_name: str) -> str:
    """User variable names can contain the ascii characters [_a-zA-Z0-9] and any non-ascii character."""
    col_name_without_invalid_chars = sub(r'/[^_a-zA-Z0-9]/g', '_', col_name)
    return f'vqb_{col_name_without_invalid_chars}'


class UnsupportedOperator(Exception):
    """Raised when condition uses an unsupported operator"""


def build_cond_expression(
    cond: Union[SimpleCondition, ConditionComboOr, ConditionComboAnd],
    unsupportedOperators: List[SimpleCondition.operator],
) -> MongoStep:
    operator_mapping = {
        'eq': '$eq',
        'ne': '$ne',
        'lt': '$lt',
        'le': '$lte',
        'gt': '$gt',
        'ge': '$gte',
        'in': '$in',
        'nin': '$in',
        'isnull': '$eq',
        'notnull': '$ne',
        'matches': '$regexMatch',
        'notmatches': '$regexMatch',
        'from': '$gte',
        'until': '$lte',
    }
    if isinstance(cond, ConditionComboAnd):
        if len(cond.and_) == 1:
            return build_cond_expression(cond.and_[0], unsupportedOperators)
        else:
            return {
                '$and': [build_cond_expression(elem, unsupportedOperators) for elem in cond.and_]
            }
    if isinstance(cond, ConditionComboOr):
        return {'$and': [build_cond_expression(elem, unsupportedOperators) for elem in cond.or_]}
    if cond.operator in unsupportedOperators:
        raise UnsupportedOperator(f'Unsupported operator ${cond.operator} in conditions')

    if cond.operator == 'matches' or cond.operator == 'notmatches':
        cond_expression = {'$regexMatch': {'input': f'${cond.column}', 'regex': cond.value}}
        if cond.operator == 'notmatches':
            cond_expression = {'$not': cond_expression}
        return cond_expression

    else:
        if cond.operator == 'notnull' or cond.operator == 'isnull':
            return {operator_mapping[cond.operator]: [f'${cond.column}', None]}

        else:
            cond_expression = {operator_mapping[cond.operator]: [f'${cond.column}', cond.value]}
            if cond.operator == 'nin':
                cond_expression = {'$not': cond_expression}

            if cond.operator == 'until':
                if isinstance(cond.value, datetime.datetime):
                    cond_expression[operator_mapping[cond.operator]][1] = datetime.datetime(
                        day=cond.value.day, month=cond.value.month, year=cond.value.month
                    ).replace(hour=23, minute=59, second=59, microsecond=999999)

            if cond.operator == 'from' or cond.operator == 'until':
                return {
                    '$expr': {
                        operator_mapping[cond.operator]: [
                            truncate_to_day(f'${cond.column}'),
                            truncate_to_day(
                                translate_relative_date(cond.value)
                                if isinstance(cond.value, RelativeDate)
                                else cond.value
                            ),
                        ]
                    }
                }
            return cond_expression
