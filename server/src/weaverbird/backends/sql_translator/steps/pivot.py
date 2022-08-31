from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
    sanitize_column_name,
)
from weaverbird.backends.sql_translator.types import (
    SQLDialect,
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryExecutor,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import PivotStep


def translate_pivot(
    step: PivotStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"PIVOT_STEP_{index}"

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step: {step}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )
    aggregate_part = f"{step.agg_function}({step.value_column})"
    pivot_values = sql_query_executor(
        domain=None,
        query_string=f"""{query.transformed_query} SELECT DISTINCT({step.column_to_pivot}) FROM {query.query_name}""",
    )[f"{step.column_to_pivot}"].values.tolist()
    sanitized_columns = [sanitize_column_name(p) for p in pivot_values]

    pivoted_values_column_type = query.metadata_manager.retrieve_query_metadata_column_type_by_name(
        step.value_column
    )
    query.metadata_manager.remove_query_metadata_columns(
        query.metadata_manager.retrieve_query_metadata_columns_as_list(columns_filter=step.index)
    )
    query.metadata_manager.add_query_metadata_columns(
        columns={name: pivoted_values_column_type for name in sanitized_columns}
    )

    prepivot_query = (
        f"""PRE_{query_name} AS (SELECT {', '.join(step.index + [step.column_to_pivot, step.value_column])} FROM"""
        f""" {query.query_name})"""
    )
    pivot_query = (
        f"""SELECT {query.metadata_manager.retrieve_query_metadata_columns_as_str()}"""
        f""" FROM PRE_{query_name} PIVOT({aggregate_part} FOR {step.column_to_pivot} IN """
        f"""({', '.join([f"'{val}'" for val in pivot_values])})) AS p ({', '.join(step.index + sanitized_columns)})"""
    )
    transformed_query = (
        f"""{query.transformed_query}, {prepivot_query}, {query_name} AS ({pivot_query})"""
    )

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=transformed_query,
        selection_query=build_selection_query(
            query.metadata_manager.retrieve_query_metadata_columns(), query_name
        ),
        metadata_manager=query.metadata_manager,
    )

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    query.metadata_manager.update_query_metadata_column_names_with_alias()
    return new_query
