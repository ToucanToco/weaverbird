from typing import Tuple

from weaverbird.backends.sql_translator.steps.utils.query_transformation import generate_query_by_keeping_granularity
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.pipeline.steps import AggregateStep


def get_query_from_first_query(
    query: SQLQuery, array_cols: list, str_query: str
) -> Tuple[SQLQuery, str]:
    """
    For the given query, this function will remove metadata columns if its not on a given list
    then concatenate the join on array_cols list to the final query

    params:
    query : the given query
    array_cols : the list of columns we want to keep in the metadatas
    str_query : the end query
    """

    # we loop on tables and add new columns and get back the fresh query
    for table in query.metadata_manager.tables:
        # we add metadata columns
        [
            query.metadata_manager.remove_query_metadata_column(col)
            for col in query.metadata_manager.retrieve_columns_as_list(table)
            if col not in array_cols
        ]
    first_last_string = f"(SELECT {', '.join(array_cols)} FROM ({str_query})"

    return query, first_last_string


def get_first_last_cols_from_aggregate(step: AggregateStep) -> Tuple[list, list]:
    """
    This small method will return the first_cols and last_cols depending on the aggregation type

    """
    first_cols, last_cols = [], []
    for aggregation in [
        aggregation
        for aggregation in step.aggregations
        if aggregation.agg_function in ['first', 'last']
    ]:
        # we loop to construct our first/last columns
        for col, new_col in zip(aggregation.columns, aggregation.new_columns):
            if aggregation.agg_function == 'first':
                first_cols.append((col, new_col))
            else:
                last_cols.append((col, new_col))

    return first_cols, last_cols


def first_last_query_string_with_group_and_granularity(
    step: AggregateStep,
    query: SQLQuery,
    scope_cols: list,
) -> Tuple[SQLQuery, str]:
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

    # we add metadata columns
    [
        query.metadata_manager.add_query_metadata_column(new_col, "float")
        for (col, new_col) in scope_cols
    ]

    if len(step.on):
        # depending on the granularity keep parameter
        # we should remove unnecessary columns
        if step.keep_original_granularity:
            end_query = (
                f"SELECT *,{', '.join([f'{col} AS {new_col}' for (col, new_col) in scope_cols] + ['ROW_NUMBER()'])}"
                f" OVER (PARTITION BY {', '.join(step.on)}"
                f" ORDER BY {', '.join([f'{c[0]}' for c in scope_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            final_end_query_string = f"(SELECT * FROM ({end_query})"
        else:
            # the difference on the  if col != new_col after the loop
            end_query = (
                f"SELECT *, {', '.join([f'{col} AS {new_col}' for (col, new_col) in scope_cols if col != new_col] + ['ROW_NUMBER()'])}"
                f" OVER (PARTITION BY {', '.join(step.on)}"
                f" ORDER BY {', '.join([f'{c[0]}' for c in scope_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            # we fresh an concatenate the final first_last_string
            query, final_end_query_string = get_query_from_first_query(
                query, [f'{c[1]}' for c in scope_cols] + step.on, end_query
            )
    else:
        # depending on the granularity keep parameter
        # we should remove unnecessary columns
        if step.keep_original_granularity:
            end_query = (
                f"SELECT *,{', '.join(step.on + [f'{col} AS {new_col}' for (col, new_col) in scope_cols] + ['ROW_NUMBER()'])} OVER ("
                f"ORDER BY {', '.join([f'{c[0]}' for c in scope_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            final_end_query_string = f"(SELECT * FROM ({end_query})"
        else:
            end_query = (
                f"SELECT *,{', '.join(step.on + [f'{col} AS {new_col}' for (col, new_col) in scope_cols if col != new_col] + ['ROW_NUMBER()'])} OVER ("
                f"ORDER BY {', '.join([f'{c[0]}' for c in scope_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            # we fresh an concatenate the final first_last_string
            query, final_end_query_string = get_query_from_first_query(
                query, [f'{c[1]}' for c in scope_cols], end_query
            )

    return query, final_end_query_string


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


def build_first_or_last_aggregation(
    aggregated_string: str, first_last_string: str, query: SQLQuery, step: AggregateStep
) -> Tuple[SQLQuery, str]:
    """
    This method will help us build the first-last aggregation query

    params:
    aggregated_string: the aggregate string
    first_last_string: the first_last string
    query: the incoming sql-query
    step: the aggregate step
    """
    # extract first-last cols
    first_cols, last_cols = get_first_last_cols_from_aggregate(step)

    # first agreggate
    if len(first_cols) and not len(last_cols):
        query, first_last_string = first_last_query_string_with_group_and_granularity(
            step=step,
            query=query,
            scope_cols=first_cols,
        )

    # last agreggate
    if len(last_cols) and not len(first_cols):
        query, first_last_string = first_last_query_string_with_group_and_granularity(
            step=step,
            query=query,
            scope_cols=last_cols,
        )

    # first and last agreggate
    if len(last_cols) and len(first_cols):
        query, first_last_string = first_last_query_string_with_group_and_granularity(
            step=step,
            query=query,
            scope_cols=last_cols + first_cols,
        )

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
