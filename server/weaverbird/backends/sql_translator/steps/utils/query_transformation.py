from weaverbird.pipeline.conditions import ComparisonCondition, Condition

SQL_COMPARISON_OPERATORS = {
    'eq': '=',
    'ne': '!=',
    'lt': '<',
    'le': '<=',
    'gt': '>',
    'ge': '>=',
}


def apply_condition(condition: Condition, query: str) -> str:
    query = f'select * from ({query}) '

    if isinstance(condition, ComparisonCondition):
        query += f'where {condition.column} {SQL_COMPARISON_OPERATORS[condition.operator]} {condition.value}'
        return query
    else:
        raise NotImplementedError('Only comparison conditions are implemented')
