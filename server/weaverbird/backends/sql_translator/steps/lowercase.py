from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query, complete_fields, clean_query_metadata_duplications,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import LowercaseStep


def translate_lowercase(
    step: LowercaseStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'LOWERCASE_STEP_{index}'

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step.name: {step.name}\n"
        f"step.column: {step.column}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.tables_metadata: {query.metadata_manager.tables_metadata}\n"
    )
    query = clean_query_metadata_duplications(query)

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {complete_fields(columns=[step.column], step=step, query=query)},"""
        f""" LOWER({step.column}) AS {step.column}"""
        f""" FROM {query.query_name}) """,
        selection_query=build_selection_query(query.metadata_manager.tables_metadata, query_name),
        metadata_manager=query.metadata_manager,
    )

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
