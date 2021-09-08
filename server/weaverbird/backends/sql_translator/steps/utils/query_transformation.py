import re
from typing import Dict, List, Tuple

from weaverbird.backends.sql_translator.metadata import ColumnMetadata, SqlQueryMetadataManager
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.pipeline.conditions import (
    ComparisonCondition,
    Condition,
    ConditionComboAnd,
    ConditionComboOr,
    InclusionCondition,
    MatchCondition,
    NullCondition,
)
from weaverbird.pipeline.steps import AggregateStep

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
            # just to escape single quotes from crashing the snowflakeSQL query
            if type(condition.value) == str:
                condition.value = sanitize_input(condition.value)
            query += f"{condition.column} {SQL_COMPARISON_OPERATORS[condition.operator]} '{condition.value}'"
    elif isinstance(condition, NullCondition):
        query += f'{condition.column} {SQL_NULLITY_OPERATORS[condition.operator]}'
    elif isinstance(condition, MatchCondition):
        # just to escape single quotes from crashing the snowflakeSQL query
        if type(condition.value) == str:
            condition.value = sanitize_input(condition.value)
        query += f"{condition.column} {SQL_MATCH_OPERATORS[condition.operator]} '{condition.value}'"
    elif isinstance(condition, InclusionCondition):
        query += f'{condition.column} {SQL_INCLUSION_OPERATORS[condition.operator]} {str(tuple(condition.value))}'
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


def build_selection_query(query_metadata: Dict[str, ColumnMetadata], query_name) -> str:
    names = []
    for _, metadata in query_metadata.items():
        alias = getattr(metadata, 'alias')
        if alias:
            names.append(alias)
        else:
            names.append(getattr(metadata, 'name'))
    return f"SELECT {', '.join(names)} FROM {query_name}"


def build_first_or_last_aggregation(
    aggregated_string: str, first_last_string: str, query: SQLQuery, step: AggregateStep
) -> Tuple[SQLQuery, str]:
    """


    """
    # TODO : Provide more specifics comments for this function and a way to split it, i mean... it's too much HUGE lol
    first_cols, last_cols = [], []
    for aggregation in [
        aggregation
        for aggregation in step.aggregations
        if aggregation.agg_function in ['first', 'last']
    ]:

        for col, new_col in zip(aggregation.columns, aggregation.new_columns):
            if aggregation.agg_function == 'first':
                first_cols.append((col, new_col))
            else:
                last_cols.append((col, new_col))
    if len(first_cols) and not len(last_cols):
        if len(step.on):
            # we add metadata columns
            [
                query.metadata_manager.add_query_metadata_column(new_col, "float")
                for (col, new_col) in first_cols
            ]

            # depending on the granularity keep parameter
            # we should remove unnecessary columns
            if step.keep_original_granularity:
                firsts_query = (
                    f"SELECT *,{', '.join([f'{col} AS {new_col}' for (col, new_col) in first_cols] + ['ROW_NUMBER()'])}"
                    f" OVER (PARTITION BY {', '.join(step.on)}"
                    f" ORDER BY {', '.join([c[0] for c in first_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
                )
                first_last_string = f"(SELECT * FROM ({firsts_query})"
            else:
                # the difference on the  if col != new_col after the loop
                firsts_query = (
                    f"SELECT *, "
                    f"{', '.join([f'{col} AS {new_col}' for (col, new_col) in first_cols if col != new_col] + ['ROW_NUMBER()'])}"""
                    f" OVER (PARTITION BY {', '.join(step.on)}"
                    f" ORDER BY {', '.join([c[0] for c in first_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
                )
                # we loop on tables and add new columns
                for table in query.metadata_manager.tables:
                    # we add metadata columns
                    [
                        query.metadata_manager.remove_query_metadata_column(col)
                        for col in query.metadata_manager.retrieve_columns_as_list(table)
                        if col not in [f'{c[1]}' for c in first_cols] + step.on
                    ]

                first_last_string = f"(SELECT {', '.join([f'{c[1]}' for c in first_cols] + step.on)} FROM ({firsts_query})"

        else:
            firsts_query = (
                f"SELECT {', '.join(step.on + [f'{col} AS {new_col}' for (col, new_col) in first_cols] + ['ROW_NUMBER()'])} OVER ("
                f"ORDER BY {', '.join([c[0] for c in first_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )

            first_last_string = (
                f"SELECT {', '.join([f'{c[1]}' for c in first_cols])} FROM ({firsts_query})"
            )
    if len(last_cols) and not len(first_cols):
        if len(step.on):
            lasts_query = (
                f"SELECT {', '.join([f'{col} AS {new_col}' for (col, new_col) in last_cols if new_col != col] + ['ROW_NUMBER()'])} OVER (PARTITION BY {', '.join(step.on)} "
                f"ORDER BY {', '.join([f'{c[0]} DESC' for c in last_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            first_last_string = (
                f"SELECT {', '.join([f'{c[1]}' for c in last_cols] + step.on)} FROM ({lasts_query})"
            )

            # we add metadata
            [
                query.metadata_manager.add_query_metadata_column(new_col, "float")
                for (col, new_col) in last_cols
            ]
        else:
            lasts_query = (
                f"SELECT {', '.join(step.on + [f'{col} AS {new_col}' for (col, new_col) in last_cols] + ['ROW_NUMBER()'])} OVER ("
                f"ORDER BY {', '.join([f'{c[0]} DESC' for c in last_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            first_last_string = (
                f"SELECT {', '.join([f'{c[1]}' for c in last_cols])} FROM ({lasts_query})"
            )
    if len(last_cols) and len(first_cols):
        if len(step.on):
            firsts_and_lasts_query = (
                f"SELECT {', '.join([f'{col} AS {new_col}' for (col, new_col) in first_cols] + [f'{col} AS {new_col}' for (col, new_col) in last_cols] + step.on + ['ROW_NUMBER()'])} OVER (PARTITION BY {', '.join(step.on)} "
                f"ORDER BY {', '.join([f'{c[0]}' for c in first_cols] + [f'{c[0]} DESC' for c in last_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            first_last_string = f"(SELECT {', '.join([f'{c[1]}' for c in first_cols] + [f'{c[1]}' for c in last_cols] + step.on)} FROM ({firsts_and_lasts_query})"

        else:
            firsts_and_lasts_query = (
                f"SELECT {', '.join(step.on + [f'{col} AS {new_col}' for (col, new_col) in first_cols] + [f'{col} AS {new_col}' for (col, new_col) in last_cols] + ['ROW_NUMBER()'])} OVER ("
                f"ORDER BY {', '.join([f'{c[0]}' for c in first_cols] + [f'{c[0]} DESC' for c in last_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            first_last_string = f"(SELECT {', '.join([f'{c[1]}' for c in first_cols] + [f'{c[1]}' for c in last_cols])} FROM ({firsts_and_lasts_query})"
    if len(aggregated_string) and len(first_last_string):
        if len(step.on):
            query_string = f"SELECT A.*, {', '.join([f'F.{c[1]}' for c in first_cols + last_cols])} FROM ({aggregated_string}) A INNER JOIN ({first_last_string}) F ON {' AND '.join([f'A.{s}=F.{s}' for s in step.on])}"
        else:
            query_string = f"SELECT A.*, {', '.join([f'F.{c[1]}' for c in first_cols + last_cols])} FROM ({aggregated_string}) A INNER JOIN ({first_last_string}) F"

    elif len(aggregated_string):
        query_string = aggregated_string
    else:
        query_string = first_last_string
    return query, query_string


def generate_query_by_keeping_granularity(
    group_by: list,
    prev_step_name: str,
    current_step_name: str,
    query_to_complete: str = "",
    aggregate_on_cols_skip=None,
) -> str:
    """
    On some steps, when we do the Group By we will need to keep the granularity of
    all our precedents columns

    params:
    group_by: the group by list
    prev_step_name: the previous step name (usually query.query_name)
    current_step_name: the current step name (usually query_name)
    """
    # in case it's None it should be an empty array
    if aggregate_on_cols_skip is None:
        aggregate_on_cols_skip = []

    # We build the group by query part
    group_by_query: str = ""
    on_query: str = ""
    sub_select_query: str = ""

    for index, gb in enumerate(group_by):
        # we create a subfield containing a fixed hash for the current column and the index
        sub_field = f"{gb.replace(')', '_').replace('(', '_')}_ALIAS_{index}"

        # To handle aggregates AS cases
        for c in aggregate_on_cols_skip:
            if gb in c and " AS " in c:
                sub_field = c.split(" AS ")[1]
                break

        # The sub select query
        sub_select_query += ("" if index == 0 else ", ") + f"{gb} AS {sub_field}"

        # The ON query re-group
        # the sub on query
        sub_on_query = (
            "" if index == 0 else " AND "
        ) + f"({sub_field} = {prev_step_name}_ALIAS.{gb})"
        # the sub group by query
        sub_group_by_query = ('GROUP BY ' if index == 0 else ', ') + sub_field

        # To handle aggregates AS cases
        for c in aggregate_on_cols_skip:
            if gb in c and " AS " in c:
                sub_on_query = ""
                sub_group_by_query = ""
                break

        # The ON query
        on_query += sub_on_query
        # The GROUP BY query
        group_by_query += sub_group_by_query

    return (
        f"(SELECT * FROM (SELECT {sub_select_query} {query_to_complete}"
        f" FROM {prev_step_name} {group_by_query}) {current_step_name}_ALIAS"
        f" INNER JOIN {prev_step_name} {prev_step_name}_ALIAS ON ({on_query})"
    )


def prepare_aggregation_query(
    query_name: str,
    aggregated_cols: list,
    aggregated_string: str,
    query: SQLQuery,
    step: AggregateStep,
) -> Tuple[SQLQuery, str]:
    for agg in step.aggregations:  # TODO the front should restrict - usage in column names
        agg.new_columns = [x.replace('-', '_').replace(' ', '_') for x in agg.new_columns]

    for aggregation in [
        aggregation
        for aggregation in step.aggregations
        if aggregation.agg_function not in ['first', 'last']
    ]:

        for col, new_col in zip(aggregation.columns, aggregation.new_columns):
            if aggregation.agg_function == 'count distinct':
                aggregated_cols.append(f'COUNT(DISTINCT {col}) AS {new_col}')
            else:
                aggregated_cols.append(f'{aggregation.agg_function.upper()}({col}) AS {new_col}')

            if len(step.on) == 0:
                # We remove unecessary columns
                for table in query.metadata_manager.tables:
                    column_list = query.metadata_manager.retrieve_columns_as_list(table)
                    for colu in column_list:
                        if colu not in aggregation.columns + step.on:
                            query.metadata_manager.remove_table_column(table, colu)

                    # if col not in column_list:
                    # we update the column name
                    try:
                        query.metadata_manager.update_column_name(
                            table_name=table, column_name=col, dest_column_name=new_col
                        )
                    except Exception as es:
                        print(es)

    if len(step.on) and len(aggregated_cols):
        # aliases of aggregate columns
        as_ag_columns = [cls.split(" AS ")[0] for cls in aggregated_cols]
        # we generate the query by keeping granularity
        aggregated_string = generate_query_by_keeping_granularity(
            group_by=step.on + as_ag_columns,
            prev_step_name=query.query_name,
            current_step_name=query_name,
            aggregate_on_cols_skip=aggregated_cols + step.on,
        )

        # We add some metadata
        [
            query.metadata_manager.add_query_metadata_column(cls.split(" AS ")[1], "float")
            for cls in aggregated_cols
            if " AS " in cls
        ]
    elif len(aggregated_cols):
        aggregated_string = f"SELECT {', '.join(aggregated_cols)} FROM {query.query_name}"
    return query, aggregated_string


def snowflake_date_format(input_format: str) -> str:
    """
    This method will format the standard sql format for dates into snowflake sql one
    """
    # we escape quotes here and construct our format
    # for a valid snowflake date format
    input_format = (
        None
        if input_format is None or input_format == ''
        else input_format.replace('"', '')
        .replace("'", '')
        .replace('%b', 'MON')
        .replace('%B', 'MMMM')
        .replace('%y', 'YYYY')
        .replace('%Y', 'YYYY')
        .replace('%M', 'MM')
        .replace('%m', 'MM')
        .replace('%D', 'DD')
        .replace('%d', 'DD')
    )
    input_format = '' if input_format is None or input_format == '' else f", '{input_format}'"

    return input_format


def handle_zero_division(formula: str) -> str:
    """
    Use regular expression replacement to detect '/' or '%' in formulas
    and substitute a 0 divisor by NULL
    For example in '1 % BLAAA / "BLA    BLA"'
    this r'(?<=%)\s*(\w+)' captures BLAAA and this r' NULLIF(\1, 0)' replaces it
    by NULLIF(BLAAA, 0).
    this r'(?<=/)\s*(\"?.*\"?)' captures "BLA    BLA" and this r'NULLIFF(\2, 0)' replaces it
    by NULLIF("BLA    BLA", 0).
    """
    if '/' not in formula and '%' not in formula:
        return formula
    if '/' in formula:
        formula = re.sub(r'(?<=/)\s*(\w+)|(?<=/)\s*(\"?.*\"?)', r' NULLIF(\1\2, 0)', formula)
    if '%' in formula:
        formula = re.sub(r'(?<=%)\s*(\w+)|(?<=%)\s*(\"?.*\"?)', r' NULLIF(\1\2, 0)', formula)
    return formula


def build_union_query(
    query_metadata_manager: SqlQueryMetadataManager,
    current_query_name: str,
    appended_tables_name: List[str],
) -> str:
    new_query = f'SELECT {query_metadata_manager.retrieve_query_metadata_columns_as_str()} FROM {current_query_name}'
    max_column_number = len(query_metadata_manager.retrieve_query_metadata_columns_as_list())
    for t in appended_tables_name:
        table_columns = query_metadata_manager.retrieve_columns_as_list(t)
        missing_columns = max_column_number - len(table_columns)
        all_columns = table_columns + ['NULL'] * missing_columns
        new_query += f" UNION ALL SELECT {', '.join(all_columns)} FROM {t}"
    return new_query


def get_query_for_date_extract(
    date_type: str,
    target_column: str,
    new_column: str,
) -> str:
    """
    This method will get as input the date type and return a query with
    the appropriate function of that date type on snowflake, it can be a simple function or a whole expression


    """
    if date_type.lower() in [
        "year",
        "month",
        "day",
        "hour",
        "minutes",
        "seconds",
        "dayofweek",
        "dayofweekiso",
        "dayofyear",
        "week",
        "weekiso",
        "quarter",
        "yearofweek",
        "yearofweekiso",
    ]:
        date_type = date_type[:-1] if date_type in ["seconds", "minutes"] else date_type
        return f"EXTRACT({date_type.lower()} from to_timestamp({target_column})) AS {new_column}"
    else:
        appropriate_func = {
            "milliseconds": "DATE_TRUNC(millisecond, to_timestamp(____target____))",
            "isoYear": "YEAROFWEEKISO(to_timestamp(____target____))",
            "isoWeek": "WEEKISO(to_timestamp(____target____))",
            "isoDayOfWeek": "DAYOFWEEKISO(to_timestamp(____target____))",
            "firstDayOfYear": "TO_TIMESTAMP_NTZ(DATE_TRUNC(year, to_timestamp(____target____)))",
            "firstDayOfMonth": "TO_TIMESTAMP_NTZ(DATE_TRUNC(month, to_timestamp(____target____)))",
            "firstDayOfWeek": "TO_TIMESTAMP_NTZ(DATE_TRUNC(week, to_timestamp(____target____)))",
            "firstDayOfQuarter": "TO_TIMESTAMP_NTZ(DATE_TRUNC(quarter, to_timestamp(____target____)))",
            "firstDayOfIsoWeek": "DAYOFWEEKISO(to_timestamp(____target____)) - DAYOFWEEKISO(to_timestamp("
            "____target____)) + 1",
            "previousDay": "to_timestamp(____target____) - interval '1 day'",
            "firstDayOfPreviousYear": "(to_timestamp(____target____) - interval '1 year') + interval '1 day'",
            "firstDayOfPreviousMonth": "(to_timestamp(____target____) - interval '2 month') + interval '1 day'",
            "firstDayOfPreviousWeek": "DAY(to_timestamp(____target____) - interval '1 week') - DAYOFWEEKISO("
            "to_timestamp(____target____)) + 1",
            "firstDayOfPreviousQuarter": "to_timestamp(____target____) - interval '1 quarter'",
            "firstDayOfPreviousIsoWeek": "DAYOFWEEKISO(to_timestamp(____target____) - interval '1 week') - "
            "DAYOFWEEKISO(to_timestamp(____target____)) + 1",
            "previousYear": "YEAR(to_timestamp(____target____) - interval '1 year')",
            "previousMonth": "MONTH(to_timestamp(____target____) - interval '1 month')",
            "previousWeek": "WEEK(to_timestamp(____target____) - interval '1 week')",
            "previousQuarter": "QUARTER(to_timestamp(____target____) - interval '1 quarter')",
            "previousIsoWeek": "WEEKISO(to_timestamp(____target____)) - 1",
        }

        return f"({appropriate_func[date_type].replace('____target____', target_column)}) AS {new_column}"


def sanitize_input(value: str) -> str:
    return value.replace('"', '\\"').replace("'", "\\'")
