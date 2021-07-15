from numpy import logical_and, logical_or

from server.weaverbird.pipeline.conditions import Condition, ComparisonCondition, InclusionCondition, NullCondition, \
    MatchCondition, ConditionComboAnd, ConditionComboOr


def apply_condition(condition: Condition, query: str) -> str:

    query = f'select * from ({query}) '
    sql_operator = {
        'eq': '=',
        'ne': '!=',
        'lt': '<',
        'le': '<=',
        'gt': '>',
        'ge': '>=',
    }

    if isinstance(condition, ComparisonCondition):
        query += f'where {condition.column} {sql_operator[condition.operator]} {condition.value}'
        return query
    else:
        raise NotImplementedError('Only comparison conditions are implemented')
