import datetime
import re

from weaverbird.backends.sql_translator.metadata import ColumnMetadata, SqlQueryMetadataManager
from weaverbird.backends.sql_translator.types import SQLQuery
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
from weaverbird.pipeline.steps import AggregateStep

SQL_COMPARISON_OPERATORS = {
    "eq": "=",
    "ne": "!=",
    "lt": "<",
    "le": "<=",
    "gt": ">",
    "ge": ">=",
    "from": ">=",
    "until": "<=",
}

SQL_NULLITY_OPERATORS = {
    "isnull": "IS NULL",
    "notnull": "IS NOT NULL",
}

SQL_MATCH_OPERATORS = {
    "matches": "RLIKE",
    "notmatches": "NOT RLIKE",
}

SQL_INCLUSION_OPERATORS = {
    "in": "IN",
    "nin": "NOT IN",
}


def apply_condition(condition: Condition, query: str) -> str:
    if isinstance(condition, ComparisonCondition):
        try:
            if isinstance(condition.value, datetime.datetime) or isinstance(
                condition.value, datetime.date
            ):
                query += (
                    f"to_timestamp({condition.column}) {SQL_COMPARISON_OPERATORS[condition.operator]} "
                    f"to_timestamp('{condition.value.isoformat()}')"
                )
            else:
                float(condition.value)
                query += f"{condition.column} {SQL_COMPARISON_OPERATORS[condition.operator]} {condition.value}"
        except ValueError:
            # just to escape single quotes from crashing the snowflakeSQL query
            if type(condition.value) == str:
                condition.value = sanitize_input(condition.value)
            query += f"{condition.column} {SQL_COMPARISON_OPERATORS[condition.operator]} '{condition.value}'"
    elif isinstance(condition, NullCondition):
        query += f"{condition.column} {SQL_NULLITY_OPERATORS[condition.operator]}"
    elif isinstance(condition, MatchCondition):
        # just to escape single quotes from crashing the snowflakeSQL query
        if type(condition.value) == str:
            condition.value = sanitize_input(condition.value)
        query += f"{condition.column} {SQL_MATCH_OPERATORS[condition.operator]} '{condition.value}'"
    elif isinstance(condition, InclusionCondition):
        values_tuple_str = "(" + ", ".join([f"'{v}'" for v in condition.value]) + ")"
        query += (
            f"{condition.column} {SQL_INCLUSION_OPERATORS[condition.operator]} {values_tuple_str}"
        )

    elif isinstance(condition, DateBoundCondition):

        value = condition.value
        if isinstance(value, RelativeDate):
            if value.operator == "until":
                sign = -1
            elif value.operator == "from":
                sign = 1
            else:
                raise NotImplementedError
            value_query_part = f"dateadd({ value.duration }, { sign * value.quantity }, '{ value.date.isoformat() }'::DATE)"
        else:
            value_query_part = f"to_timestamp('{ value.isoformat() }')"

        # Remove time info from the column to filter on
        column = f"to_timestamp({ condition.column })"
        column_without_time = f"DATE_TRUNC('DAY', { column })"
        # Do the same with the value to compare it to
        value_without_time = f"DATE_TRUNC('DAY', { value_query_part })"

        query += f"{ column_without_time } { SQL_COMPARISON_OPERATORS[condition.operator] } { value_without_time }"

    elif isinstance(condition, ConditionComboAnd):
        query = apply_condition(condition.and_[0], query)
        for c in condition.and_[1:]:
            query = apply_condition(c, f"{query} AND ")
    elif isinstance(condition, ConditionComboOr):
        query = apply_condition(condition.or_[0], query)
        for c in condition.or_[1:]:
            query = apply_condition(c, f"{query} OR ")
    else:
        raise NotImplementedError("Only comparison conditions are implemented")
    return query


def build_selection_query(query_metadata: dict[str, ColumnMetadata], query_name) -> str:
    names = []
    for _, metadata in query_metadata.items():
        alias = getattr(metadata, "alias")
        if alias:
            names.append(alias)
        else:
            names.append(getattr(metadata, "name"))
    return f"SELECT {', '.join(names)} FROM {query_name}"


def first_last_query_string_with_group_and_granularity(
    step: AggregateStep,
    query: SQLQuery,
    scope_cols: list,
) -> tuple[SQLQuery, str]:
    """
    This function will... depending on the group by of the aggregate and the granularity conservation, generate
    the appropriate final query and clean/update the query's metadata columns

    params:
    query: the sqlquery object
    step: The current aggregate step
    select_array_cols: the selection columns in the end_query
    array_cols: the order by's columns
    scope_cols: he scope of our process, for example: firsts_cols or lasts_cols...
    """

    if len(step.on):
        # depending on the granularity keep parameter
        # we should remove unnecessary columns
        if step.keep_original_granularity:
            groupby_alias = ", ".join([f"{cc} AS X_{cc}" for cc in step.on])
            end_query = (
                f"SELECT {groupby_alias},{', '.join([f'{col} AS {new_col}' for (col, new_col) in scope_cols]+['ROW_NUMBER()'])}"
                f" OVER (PARTITION BY {', '.join(step.on)}"
                f" ORDER BY {', '.join([f'{c[0]}' for c in scope_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            # ['X.VALUE__first=Z.VALUE__first', 'X.TIME_first=Z.TIME_first']
            final_end_query_string = (
                f"SELECT * FROM ({end_query}) X "
                f"INNER JOIN (SELECT *,ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS TO_REMOVE_{query.query_name}_ALIAS"
                f" FROM {query.query_name}) Z"
                f" ON {' AND '.join([f'X.X_{s}=Z.{s}' for s in step.on])} ORDER BY TO_REMOVE_{query.query_name}_ALIAS"
            )
        else:
            # the difference on the  if col != new_col after the loop
            end_query = (
                f"SELECT *,"
                f"{', '.join([f'{col} AS {new_col}' for (col, new_col) in scope_cols if col != new_col] + ['ROW_NUMBER()'])}"
                f" OVER (PARTITION BY {', '.join(step.on)}"
                f" ORDER BY {', '.join([f'{c[0]}' for c in scope_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            # we fresh an concatenate the final first_last_string
            query, final_end_query_string = remove_metadatas_columns_from_query(
                query, [c[1] for c in scope_cols] + step.on, end_query
            )
    else:
        # depending on the granularity keep parameter
        # we should remove unnecessary columns
        if step.keep_original_granularity:
            end_query = (
                f"SELECT "
                f"{', '.join(step.on + [f'{col} AS {new_col}' for (col, new_col) in scope_cols] + ['ROW_NUMBER()'])}"
                "OVER ("
                f"ORDER BY {', '.join([f'{c[0]}' for c in scope_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            final_end_query_string = (
                f"SELECT * FROM ({end_query}) X INNER JOIN {query.query_name} Z "
            )
        else:
            end_query = (
                f"SELECT *,"
                f"{', '.join(step.on + [f'{col} AS {new_col}' for (col, new_col) in scope_cols if col != new_col] + ['ROW_NUMBER()'])} OVER ("
                f"ORDER BY {', '.join([f'{c[0]}' for c in scope_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )

            # we fresh an concatenate the final first_last_string
            query, final_end_query_string = remove_metadatas_columns_from_query(
                query, [c[1] for c in scope_cols], end_query
            )

    return query, final_end_query_string


def remove_metadatas_columns_from_query(
    query: SQLQuery, array_cols: list, first_last_string: str, first_or_last_aggregate: bool = True
) -> tuple[SQLQuery, str]:
    """
    For the given query, this function will remove metadata columns if its not on a given list
    then concatenate the join on array_cols list to the final query

    params:
    query : the given query
    array_cols : the list of columns we want to keep in the metadatas
    str_query : the end query
    """

    # we loop on tables and add new columns and get back the fresh query
    # we add metadata columns
    [
        query.metadata_manager.remove_query_metadata_column(col)
        for col in list(query.metadata_manager.retrieve_query_metadata_columns().keys())
        if col.upper() not in [c.upper() for c in array_cols]
    ]

    if first_or_last_aggregate:
        first_last_string = f"SELECT {', '.join(array_cols)} FROM ({first_last_string})"

    return query, first_last_string


def generate_query_by_keeping_granularity(
    query: SQLQuery,
    group_by: list,
    current_step_name: str,
    query_to_complete: str = "",
    aggregated_cols=None,
    group_by_except_target_columns=None,
) -> tuple[SQLQuery, str, list]:
    """
    On some steps, when we do the Group By we will need to keep the granularity of
    all our precedents columns, this method will do that operation but with an innerjoin on the precedent dataset
    then order by those elements in the group by list/array
    For example :
    SELECT * FROM (
        WITH SELECT_STEP_0 AS (
            SELECT Price, Name, Category FROM products
        ), AGGREGATE_STEP_1 AS (
            SELECT SUM(Price) AS PRICE_SUM, Category FROM SELECT_STEP_0 GROUP BY Category
        )  A INNER JOIN (SELECT * FROM SELECT_STEP_0) B
                ON A.Category = B.Category
                ORDER BY A.Category
    ) SELECT * FROM AGGREGATE_STEP_1

    params:
    group_by: the group by list
    prev_step_name: the previous step name (usually query.query_name)
    current_step_name: the current step name (usually query_name)

    it's supposed to return :
    """
    # We build the group by query part
    if group_by_except_target_columns is None:
        group_by_except_target_columns = []
    if aggregated_cols is None:
        aggregated_cols = []

    group_by_query: str = ""
    on_query: str = ""
    sub_select_query: str = ""

    for index, gb in enumerate(group_by):
        # we create a subfield containing a the alias name for the current column and the index
        sub_field = f"{gb}_ALIAS_{index}"

        # The sub select query
        sub_select_query += ("" if index == 0 else ", ") + f"{gb} AS {sub_field}"

        # The ON query re-group
        on_query += (
            "" if index == 0 else " AND "
        ) + f"({sub_field} = {query.query_name}_ALIAS.{gb})"

        # The GROUP BY query
        group_by_query += ("GROUP BY " if index == 0 else ", ") + sub_field

    new_as_columns: list = []
    for index, ag in enumerate(aggregated_cols):
        # the aggregate as word
        as_ag = ag.split(" AS ")[1]

        new_as_columns.append(as_ag)

        # The sub select query
        sub_select_query += f", {ag.split(' AS ')[0]} AS {as_ag}"

        # we apend to the array of metadata
        query.metadata_manager.add_query_metadata_column(as_ag, "float")

    return (
        query,
        (
            f"SELECT * FROM (SELECT {sub_select_query}{query_to_complete}"
            f" FROM {query.query_name} {group_by_query}) {current_step_name}_ALIAS"
            f" INNER JOIN (SELECT *, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS TO_REMOVE_{current_step_name}"
            f" FROM {query.query_name})"
            f" {query.query_name}_ALIAS ON ({on_query}) ORDER BY TO_REMOVE_{current_step_name}"
        ),
        new_as_columns,
    )


def snowflake_date_format(input_format: str) -> str:
    """
    This method will format the standard sql format for dates into snowflake sql one
    """
    # we escape quotes here and construct our format
    # for a valid snowflake date format
    input_format = (
        None
        if input_format is None or input_format == ""
        else input_format.replace('"', "")
        .replace("'", "")
        .replace("%b", "MON")
        .replace("%B", "MMMM")
        .replace("%y", "YYYY")
        .replace("%Y", "YYYY")
        .replace("%M", "MM")
        .replace("%m", "MM")
        .replace("%D", "DD")
        .replace("%d", "DD")
    )
    input_format = "" if input_format is None or input_format == "" else f", '{input_format}'"

    return input_format


def handle_zero_division(formula: str) -> str:
    """
    Use regular expression replacement to detect '/' or '%' in formulas
    and substitute a 0 divisor by NULL
    For example in '1 % BLAAA / "BLA    BLA"'
    this r'(?<=%)\\s*(\\w+)' captures BLAAA and this r' NULLIF(\1, 0)' replaces it
    by NULLIF(BLAAA, 0).
    this r'(?<=/)\\s*(\"?.*\"?)' captures "BLA    BLA" and this r'NULLIFF(\2, 0)' replaces it
    by NULLIF("BLA    BLA", 0).
    """
    if "/" not in formula and "%" not in formula:
        return formula
    if "/" in formula:
        formula = re.sub(r"(?<=/)\s*(\w+)|(?<=/)\s*(\"?.*\"?)", r" NULLIF(\1\2, 0)", formula)
    if "%" in formula:
        formula = re.sub(r"(?<=%)\s*(\w+)|(?<=%)\s*(\"?.*\"?)", r" NULLIF(\1\2, 0)", formula)
    return formula


def build_union_query(
    query_metadata_manager: SqlQueryMetadataManager,
    current_query_name: str,
    appended_tables_name: list[str],
) -> str:
    new_query = f"SELECT {query_metadata_manager.retrieve_query_metadata_columns_as_str()} FROM {current_query_name}"
    max_column_number = len(query_metadata_manager.retrieve_query_metadata_columns_as_list())
    for t in appended_tables_name:
        table_columns = query_metadata_manager.retrieve_columns_as_list(t)
        missing_columns = max_column_number - len(table_columns)
        all_columns = table_columns + ["NULL"] * missing_columns
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

    Notes on Snowflake SQL:
     - DATE_TRUNC(week, _), DAYOFWEEK(_) & WEEK result are based on the WEEK_START & WEEK_OF_YEAR_POLICY sessions parameter,
       which is set to monday by default, so we cannot reliably expect sunday based result out of it
     - DATE_TRUNC does not support the "weekiso" part
    """
    if date_type.lower() in [
        "seconds",
        "minutes",
        "hour",
        "day",
        "dayofweekiso",
        "dayofyear",
        # For week, Snowflake work on Mon-Mon however we wanted it on Sun-Sun
        # that cause some divergences on results of the fixture on :
        #   - date "2021-03-29T00:00:00.000Z", and week should be 14 but we got 13
        #   - date "2020-12-13T00:00:00.000Z", dans week should be 51 but we got 50
        # we changed the fixture to let tests pass for now
        "week",
        "weekiso",
        "month",
        "quarter",
        "year",
        "yearofweek",
        "yearofweekiso",
    ]:
        date_type = date_type[:-1] if date_type in ["seconds", "minutes"] else date_type
        return f"EXTRACT({date_type.lower()} from to_timestamp({target_column})) AS {new_column}"
    else:
        appropriate_func = {
            # Returning numbers
            # -----------------
            "milliseconds": "ROUND(EXTRACT(nanosecond FROM to_timestamp(____target____))/1000000)",
            "isoDayOfWeek": "DAYOFWEEKISO(to_timestamp(____target____))",
            "isoWeek": "WEEKISO(to_timestamp(____target____))",
            "isoYear": "YEAROFWEEKISO(to_timestamp(____target____))",
            # same problem as 'week' behaviour
            "previousWeek": "WEEK(to_timestamp(____target____) - interval '1 week')",
            "previousIsoWeek": "WEEKISO(to_timestamp(____target____) - interval '1 week')",
            "previousMonth": "MONTH(to_timestamp(____target____) - interval '1 month')",
            "previousQuarter": "QUARTER(to_timestamp(____target____) - interval '1 quarter')",
            "previousYear": "YEAR(to_timestamp(____target____) - interval '1 year')",
            "dayOfWeek": "DAYOFWEEKISO(to_timestamp(____target____)) % 7 + 1",
            # Returning dates
            # ---------------
            "previousDay": "DATE_TRUNC(day, to_timestamp(____target____) - interval '1 day')",
            "firstDayOfWeek": "DATE_TRUNC(day, DATEADD(day, -(DAYOFWEEKISO(to_timestamp(____target____)) % 7 + 1)+1, to_timestamp(____target____)))",
            "firstDayOfIsoWeek": "DATE_TRUNC(day, DATEADD(day, -DAYOFWEEKISO(to_timestamp(____target____))+1, to_timestamp(____target____)))",
            "firstDayOfMonth": "TO_TIMESTAMP_NTZ(DATE_TRUNC(month, to_timestamp(____target____)))",
            "firstDayOfQuarter": "TO_TIMESTAMP_NTZ(DATE_TRUNC(quarter, to_timestamp(____target____)))",
            "firstDayOfYear": "TO_TIMESTAMP_NTZ(DATE_TRUNC(year, to_timestamp(____target____)))",
            "firstDayOfPreviousWeek": "DATE_TRUNC(day, DATEADD(day, -(DAYOFWEEKISO(to_timestamp(____target____)) % 7 + 1)+1, to_timestamp(____target____))) - interval '1 week'",
            "firstDayOfPreviousIsoWeek": "DATE_TRUNC(day, DATEADD(day, -DAYOFWEEKISO(to_timestamp(____target____))+1, to_timestamp(____target____))) - interval '1 week'",
            "firstDayOfPreviousMonth": "TO_TIMESTAMP_NTZ(DATE_TRUNC(month, to_timestamp(____target____))) - interval '1 month'",
            "firstDayOfPreviousQuarter": "TO_TIMESTAMP_NTZ(DATE_TRUNC(quarter, to_timestamp(____target____))) - interval '1 quarter'",
            "firstDayOfPreviousYear": "TO_TIMESTAMP_NTZ(DATE_TRUNC(year, to_timestamp(____target____))) - interval '1 year'",
        }

        return f"({appropriate_func[date_type].replace('____target____', target_column)}) AS {new_column}"


def sanitize_input(value: str) -> str:
    return value.replace('"', '\\"').replace("'", "\\'")


def sanitize_column_name(col: str) -> str:
    # see   https://docs.snowflake.com/en/sql-reference/identifiers-syntax.html
    if col[0].isdigit():
        return f"_{col[0]}{re.sub(r'[^0-9a-zA-Z_$]', '_', col[1:])}"
    else:
        return re.sub(r"[^0-9a-zA-Z_$]", "_", col)


def build_aggregated_columns(aggregations):
    aggregated_columns = []
    for aggregation in aggregations:
        for col, newcol in zip(aggregation.columns, aggregation.new_columns):
            aggregated_columns.append(
                f"{aggregation.agg_function.upper()}({col}) AS {newcol}"
                if aggregation.agg_function != "count distinct"
                else f"COUNT(DISTINCT {col}) AS {newcol}"
            )
    return aggregated_columns


def build_hierarchical_columns_list(step):
    level_columns = " ".join(
        [f"WHEN {c} IS NOT NULL THEN '{c.upper()}'" for c in step.hierarchy[::-1]]
    )
    level_columns = f"CASE {level_columns} ELSE '' END AS {step.level_col or 'LEVEL'}"
    label_columns = (
        f"""COALESCE({', '.join(step.hierarchy[::-1])}) AS {step.label_col or "LABEL"}"""
    )
    parent_columns = []
    for p, c in zip(step.hierarchy, step.hierarchy[1:]):
        parent_columns.append(f"""WHEN {step.level_col or "LEVEL"} = '{c}' THEN "{p}" """)
    parent_columns = (
        f"""CASE {''.join(parent_columns)}ELSE NULL END AS {step.parent_label_col or 'PARENT'}"""
    )

    aggregated_columns = build_aggregated_columns(step.aggregations)

    all_columns = (
        step.hierarchy
        + (step.groupby or [])
        + [label_columns, level_columns, parent_columns]
        + aggregated_columns
    )
    return ", ".join(all_columns)
