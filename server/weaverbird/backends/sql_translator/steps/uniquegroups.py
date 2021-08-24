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

    select_query = complete_fields(query=query)
    group_by_query: str = ""
    if len(step.on) > 0:
        # We build the group by query part
        group_by_query = f" GROUP BY {', '.join([gb for gb in step.on])}"
        # We remove unnecessary columns
        query.metadata_manager.remove_column(all_except=step.on)
        select_query = ', '.join(step.on)

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=(
            f"""{query.transformed_query}, {query_name} AS"""
            f""" (SELECT {select_query}"""
            f""" FROM {query.query_name}{group_by_query}) """
        ),
        selection_query=build_selection_query(query.metadata_manager.query_metadata, query_name),
        metadata_manager=query.metadata_manager,
    )

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
