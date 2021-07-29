from typing import Dict

from weaverbird.pipeline.conditions import (
    ComparisonCondition,
    Condition,
    ConditionComboAnd,
    ConditionComboOr,
    InclusionCondition,
    MatchCondition,
    NullCondition,
)

SQL_COMPARISON_OPERATORS = {
    'eq': '=',
    'ne': '!=',
    'lt': '<',
    'le': '<=',
    'gt': '>',
    'ge': '>=',
}

SQL_NULLITY_OPERATORS = {
    'isnull': 'IS NULL',
    'notnull': 'IS NOT NULL',
}

SQL_MATCH_OPERATORS = {
    'matches': 'RLIKE',
    'notmatches': 'NOT RLIKE',
}

SQL_INCLUSION_OPERATORS = {
    'in': 'IN',
    'nin': 'NOT IN',
}


def apply_condition(condition: Condition, query: str) -> str:
    if isinstance(condition, ComparisonCondition):
        try:
            float(condition.value)
            query += f'{condition.column} {SQL_COMPARISON_OPERATORS[condition.operator]} {condition.value}'
        except ValueError:
            query += f"{condition.column} {SQL_COMPARISON_OPERATORS[condition.operator]} '{condition.value}'"
    elif isinstance(condition, NullCondition):
        query += f'{condition.column} {SQL_NULLITY_OPERATORS[condition.operator]}'
    elif isinstance(condition, MatchCondition):
        query += f"{condition.column} {SQL_MATCH_OPERATORS[condition.operator]} '{condition.value}'"
    elif isinstance(condition, InclusionCondition):
        query += f"{condition.column} {SQL_INCLUSION_OPERATORS[condition.operator]} {str(tuple(condition.value))}"
    elif isinstance(condition, ConditionComboAnd):
        query = apply_condition(condition.and_[0], query)
        for c in condition.and_[1:]:
            query = apply_condition(c, f'{query} AND ')
    elif isinstance(condition, ConditionComboOr):
        query = apply_condition(condition.or_[0], query)
        for c in condition.or_[1:]:
            query = apply_condition(c, f'{query} OR ')
    else:
        raise NotImplementedError('Only comparison conditions are implemented')
    return query


def build_selection_query(tables_metadata: Dict[str, Dict[str, str]], query_name: str) -> str:
    # TODO When graphical table selection will be implemented
    # build the column_string using ', '.join([f'{table}.{c}' for table in tables_metadata for c in tables_metadata[table].keys()])
    # for now only use the default table name
    return f"SELECT {', '.join(tables_metadata['table1'].keys())} FROM {query_name}"
