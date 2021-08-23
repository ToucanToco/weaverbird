from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
    complete_fields,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import UniqueGroupsStep


def translate_uniquegroups(
    step: UniqueGroupsStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'UNIQUEGROUPS_STEP_{index}'

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step.name: {step.name}\n"
        f"step.on: {step.on}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.tables_metadata: {query.metadata_manager.tables_metadata}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.query_metadata}\n"
    )

    # We build the group by query part
    group_by_query: str = ""
    for index, gb in enumerate(step.on):
        group_by_query += ("GROUP BY " if index == 0 else ", ") + gb

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {complete_fields(columns=[], query=query)}"""
        f""" FROM {query.query_name} {group_by_query}) """,
        selection_query=build_selection_query(query.metadata_manager.query_metadata, query_name),
        metadata_manager=query.metadata_manager,
    )

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
