from typing import Tuple

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    first_last_query_string_with_group_and_granularity,
    generate_query_by_keeping_granularity,
    remove_metadatas_columns_from_query,
)
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.pipeline.steps import AggregateStep
from weaverbird.pipeline.steps.aggregate import Aggregation


def get_old_new_columns(aggregation: Aggregation):
    """
    From new/old columns this function will return a list of tuple
    from an aggregation
    """
    result = []
    # we loop to construct our first/last columns
    for col, new_col in zip(aggregation.columns, aggregation.new_columns):
        result.append((col, new_col))

    merge_result = []
    for col in result:
        merge_result.append(col)

    return merge_result


def get_aggs_columns(step: AggregateStep, agg_type: str = "") -> list:
    """
    This method will return the first's/last's aggregations columns
    or normal aggregations depending on the agg_type
    default value is empty, that means it will return all agregations except first and last

    params:
    step: the aggregate step
    agg_type: the aggregate type (first/last)
    """
    result = []
    for aggregation in step.aggregations:
        if agg_type != "":
            if aggregation.agg_function == agg_type:
                test = get_old_new_columns(aggregation)
                result += test
        else:
            test = get_old_new_columns(aggregation)
            result += test
    # if len(step.on):
    #     for aggregation in step.aggregations:
    #         if agg_type != "":
    #             test = get_old_new_columns(aggregation)
    #             result += test
    #         elif aggregation.agg_function == agg_type:
    #             test = get_old_new_columns(aggregation)
    #             result += test
    # else:
    #     result = (
    #         [
    #             get_old_new_columns(aggregation)[0]
    #             for aggregation in step.aggregations
    #             if aggregation.agg_function == agg_type
    #         ]
    #         if agg_type != ""
    #         else [get_old_new_columns(aggregation)[0] for aggregation in step.aggregations]
    #     )
    return result


def get_first_columns(step: AggregateStep) -> list:
    """
    This method will return all first column from the aggregate step

    params:
    step: the aggregate step
    """
    return get_aggs_columns(step, "first")


def get_last_columns(step: AggregateStep) -> list:
    """
    This method will return all last column from the aggregate step

    params:
    step: the aggregate step
    """
    return get_aggs_columns(step, "last")


def build_first_or_last_aggregation(
    aggregated_string: str,
    first_last_string: str,
    query: SQLQuery,
    step: AggregateStep,
    query_name: str,
    new_as_columns=None,
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
    if new_as_columns is None:
        new_as_columns = []

    first_cols = get_first_columns(step)
    last_cols = get_last_columns(step)
    aggregate_cols = get_aggs_columns(step)

    query_string: str = ""
    # we add metadata columns
    [
        query.metadata_manager.add_query_metadata_column(new_col, "FLOAT")
        for (col, new_col) in aggregate_cols
    ]

    query, first_last_string = first_last_query_string_with_group_and_granularity(
        step=step,
        query=query,
        scope_cols=aggregate_cols,
    )

    if len(aggregated_string) and (len(first_cols) or len(last_cols)):
        if len(step.on):
            # to prevent duplications
            query_string = (
                f"SELECT A.*, {', '.join([f'F.{c[1]}' for c in first_cols + last_cols])} FROM ({aggregated_string})"
                f" A INNER JOIN ({first_last_string}) F ON {' AND '.join([f'A.{s}=F.{s}' for s in step.on])}"
            )

            if step.keep_original_granularity:
                query_string += (
                    f" AND (A.TO_REMOVE_{query_name} = F.TO_REMOVE_{query.query_name}_ALIAS)"
                )
            else:
                # we fresh the query and concatenate the previous query string
                query, query_string = remove_metadatas_columns_from_query(
                    query,
                    [f'{c}' for c in aggregate_cols] + step.on + new_as_columns,
                    query_string,
                    False,
                )
        else:
            query_string = (
                f"SELECT A.*, {', '.join([f'F.{c[1]}' for c in first_cols + last_cols])} FROM ({aggregated_string})"
                f" A INNER JOIN ({first_last_string}) F"
            )

            if step.keep_original_granularity:
                query_string += (
                    f" ON (A.TO_REMOVE_{query_name} = F.TO_REMOVE_{query.query_name}_ALIAS)"
                )
            else:
                # we fresh the query and concatenate the previous query string
                query, query_string = remove_metadatas_columns_from_query(
                    query,
                    [f'{c}' for c in aggregate_cols] + new_as_columns,
                    query_string,
                    False,
                )

    elif len(aggregated_string):
        query_string = aggregated_string
    else:
        query_string = first_last_string

    return query, query_string


def prepare_aggregation_query(
    query_name: str,
    aggregated_cols: list,
    aggregated_string: str,
    query: SQLQuery,
    step: AggregateStep,
) -> Tuple[SQLQuery, str, list]:
    new_as_columns: list = []

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
        if step.keep_original_granularity:
            # we generate the query by keeping granularity
            # and update the query metadatas for new as columns
            query, aggregated_string, new_as_columns = generate_query_by_keeping_granularity(
                query=query,
                group_by=step.on,
                aggregated_cols=aggregated_cols,
                current_step_name=query_name,
            )
        else:
            aggregated_string = (
                f"SELECT * FROM (SELECT {', '.join(step.on + aggregated_cols)}"
                f" FROM {query.query_name} GROUP BY {', '.join(step.on)} ORDER BY {', '.join(step.on)})"
                f" {query.query_name}_ALIAS"
            )
            # we loop on tables and add new columns and get back the fresh query
            for table in query.metadata_manager.tables:
                # we add metadata columns
                [
                    query.metadata_manager.remove_query_metadata_column(col)
                    for col in query.metadata_manager.retrieve_columns_as_list(table)
                    if col not in step.on + [c.split(" AS ")[1] for c in aggregated_cols]
                ]
    elif len(aggregated_cols):
        aggregated_string = f"SELECT {', '.join(aggregated_cols)} FROM {query.query_name}"
    return query, aggregated_string, new_as_columns
