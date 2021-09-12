from typing import Tuple

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    first_last_query_string_with_group_and_granularity,
    generate_query_by_keeping_granularity,
    get_query_from_first_query,
)
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.pipeline.steps import AggregateStep


def get_first_last_cols_from_aggregate(step: AggregateStep) -> Tuple[list, list, list]:
    """
    This small method will return the first_cols and last_cols depending on the aggregation type

    """
    first_cols, last_cols, aggregate_cols = [], [], []
    for aggregation in step.aggregations:
        # we loop to construct our first/last columns
        for col, new_col in zip(aggregation.columns, aggregation.new_columns):
            if aggregation.agg_function in ['first', 'last']:
                if aggregation.agg_function == 'first':
                    first_cols.append((col, new_col))
                else:
                    last_cols.append((col, new_col))
            else:
                aggregate_cols.append((col, new_col))

    return first_cols, last_cols, aggregate_cols


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
    first_cols, last_cols, aggregate_cols = get_first_last_cols_from_aggregate(step)

    # we add metadata columns
    [
        query.metadata_manager.add_query_metadata_column(new_col, "float")
        for (col, new_col) in last_cols + first_cols
    ]

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
            query_string = (
                f"SELECT A.*, {', '.join([f'F.{c[1]}' for c in first_cols + last_cols])} FROM ({aggregated_string})"
                f" A INNER JOIN ({first_last_string}) F ON {' AND '.join([f'A.{s}=F.{s}' for s in step.on])}"
            )
            if not step.keep_original_granularity:
                # we fresh the query and concatenate the previous query string
                query, query_string = get_query_from_first_query(
                    query, [f'{c[1]}' for c in last_cols + first_cols], query_string, False
                )
        else:
            query_string = (
                f"SELECT A.*, {', '.join([f'F.{c[1]}' for c in first_cols + last_cols])} FROM ({aggregated_string})"
                f" A INNER JOIN ({first_last_string}) F"
            )

            if not step.keep_original_granularity:
                # we fresh the query and concatenate the previous query string
                query, query_string = get_query_from_first_query(
                    query, [f'{c[1]}' for c in last_cols + first_cols], query_string, False
                )

    elif len(aggregated_string):
        query_string = aggregated_string

        if not step.keep_original_granularity:
            if len(step.on):
                # we fresh the query and concatenate the previous query string
                query, query_string = get_query_from_first_query(
                    query, [f'{c[1]}' for c in aggregate_cols] + step.on, query_string, False
                )
            else:
                # we fresh the query and concatenate the previous query string
                query, query_string = get_query_from_first_query(
                    query, [f'{c[1]}' for c in aggregate_cols], query_string, False
                )
    else:
        query_string = first_last_string

        if not step.keep_original_granularity:
            if len(step.on):
                # we fresh the query and concatenate the previous query string
                query, query_string = get_query_from_first_query(
                    query, [f'{c[1]}' for c in aggregate_cols] + step.on, query_string, False
                )
            else:
                # we fresh the query and concatenate the previous query string
                query, query_string = get_query_from_first_query(
                    query, [f'{c[1]}' for c in aggregate_cols], query_string, False
                )

    return query, query_string


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

        # we generate the query by keeping granularity
        aggregated_string = generate_query_by_keeping_granularity(
            query=query,
            group_by=step.on,
            aggregated_cols=aggregated_cols,
            current_step_name=query_name
        )

    elif len(aggregated_cols):
        aggregated_string = f"SELECT {', '.join(aggregated_cols)} FROM {query.query_name}"
    return query, aggregated_string
