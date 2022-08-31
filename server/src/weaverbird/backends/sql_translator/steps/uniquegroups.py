from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLDialect,
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryExecutor,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import UniqueGroupsStep


def translate_uniquegroups(
    step: UniqueGroupsStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"UNIQUEGROUPS_STEP_{index}"

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step.name: {step.name}\n"
        f"step.on: {step.on}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )

    columns = [c.upper() for c in step.on]
    if len(columns) > 0:
        cols = query.metadata_manager.retrieve_query_metadata_columns_as_list()
        cols_to_remove = [c for c in cols if c not in columns]
        query.metadata_manager.remove_query_metadata_columns(cols_to_remove)
    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str()
    group_query = f" GROUP BY {completed_fields})" if len(columns) > 0 else ")"

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=(
            f"""{query.transformed_query}, {query_name} AS"""
            f""" (SELECT {completed_fields}"""
            f""" FROM {query.query_name}"""
            f"""{group_query}"""
        ),
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

    return new_query
