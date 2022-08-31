from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    first_last_query_string_with_group_and_granularity,
    generate_query_by_keeping_granularity,
    remove_metadatas_columns_from_query,
)
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.pipeline.steps import AggregateStep
from weaverbird.pipeline.steps.aggregate import Aggregation


def get_aggs_columns(step: AggregateStep, agg_type: str = "") -> list:
    """
    This method will return the first's/last's aggregations columns
    or normal aggregations depending on the agg_type
    default value is empty, that means it will return all agregations except first and last

    params:
    step: the aggregate step
    agg_type: the aggregate type (first/last)
    """

    def get_old_new_columns(aggregation: Aggregation):
        """
        From new/old columns this function will return a list of tuple
        from an aggregation
        """
        result = []
        # we loop to construct our first/last columns
        for col, new_col in zip(aggregation.columns, aggregation.new_columns):
            result.append((col, new_col))

        return result

    result = []
    for aggregation in step.aggregations:
        if agg_type == "":
            result += get_old_new_columns(aggregation)
        elif aggregation.agg_function == agg_type:
            result += get_old_new_columns(aggregation)

    return result


def build_first_or_last_aggregation(
    aggregated_string: str,
    first_last_string: str,
    query: SQLQuery,
    step: AggregateStep,
    query_name: str,
    new_as_columns=None,
) -> tuple[SQLQuery, str]:
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

    first_cols = get_aggs_columns(step, "first")
    last_cols = get_aggs_columns(step, "last")
    aggregate_cols = get_aggs_columns(step)

    query_string: str = ""

    def clean_none_aggregate_columns():
        """This pseudo method will remove all columns except the one provided"""
        return remove_metadatas_columns_from_query(
            query=query,
            array_cols=[f"{c[1]}" for c in aggregate_cols] + step.on + new_as_columns,
            first_last_string=query_string,
            first_or_last_aggregate=False,
        )

    # we add metadata aggregatescolumns
    [
        query.metadata_manager.add_query_metadata_column(target_col, "FLOAT")
        for target_col in [col[1] for col in aggregate_cols] + step.on
    ]

    # we build first/last aggregation query with a group by and granularity
    query, first_last_string = first_last_query_string_with_group_and_granularity(
        step=step,
        query=query,
        scope_cols=aggregate_cols,
    )

    if len(aggregated_string) and (len(first_cols) or len(last_cols)):
        group_by_sub_query: str = ""
        on_join_sub_query: str = ""
        if len(step.on):
            group_by_sub_query = f" ON {' AND '.join([f'A.{s}=F.{s}' for s in step.on])}"
            if step.keep_original_granularity:
                on_join_sub_query = (
                    f" AND (A.TO_REMOVE_{query_name} = F.TO_REMOVE_{query.query_name}_ALIAS)"
                )
            else:
                # we fresh the query and concatenate the previous query string
                query, query_string = clean_none_aggregate_columns()
        else:
            if step.keep_original_granularity:
                on_join_sub_query = (
                    f" ON (A.TO_REMOVE_{query_name} = F.TO_REMOVE_{query.query_name}_ALIAS)"
                )
            else:
                # we fresh the query and concatenate the previous query string
                query, query_string = clean_none_aggregate_columns()

        # we get our final query string
        query_string = (
            f"SELECT A.*, {', '.join([f'F.{c[1]}' for c in first_cols + last_cols])} FROM ({aggregated_string})"
            f" A INNER JOIN ({first_last_string}) F{group_by_sub_query}{on_join_sub_query}"
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
) -> tuple[SQLQuery, str, list]:
    new_as_columns: list = []

    for agg in step.aggregations:  # TODO the front should restrict - usage in column names
        agg.new_columns = [x.replace("-", "_").replace(" ", "_") for x in agg.new_columns]

    for aggregation in [
        aggregation
        for aggregation in step.aggregations
        if aggregation.agg_function not in ["first", "last"]
    ]:

        for col, new_col in zip(aggregation.columns, aggregation.new_columns):
            if aggregation.agg_function == "count distinct":
                aggregated_cols.append(f"COUNT(DISTINCT {col}) AS {new_col}")
            else:
                aggregated_cols.append(f"{aggregation.agg_function.upper()}({col}) AS {new_col}")

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
            # we fresh the query and concatenate the previous query string
            query, _ = remove_metadatas_columns_from_query(
                query,
                step.on + [c.split(" AS ")[1] for c in aggregated_cols],
                "",
                False,
            )
    elif len(aggregated_cols):
        aggregated_string = f"SELECT {', '.join(aggregated_cols)} FROM {query.query_name}"
    return query, aggregated_string, new_as_columns
