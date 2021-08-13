from distutils import log
from typing import List

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import ConvertStep


def complete_fields(columns: List, query: SQLQuery) -> str:
    """
    We're going to complete missing field from the query

    """
    compiled_query: str = ""
    for table in [*query.metadata_manager.tables_metadata]:
        # TODO : changes the management columns on joins with duplicated columns
        for elt in query.metadata_manager.tables_metadata[table].keys():
            compiled_query += f'{elt}, ' if elt not in columns else ''

    return compiled_query


def format_cast_to_sql(columns: List, data_type: str) -> str:
    """
    From cast to sql
    """
    compiled_query: str = ""
    for index, c in enumerate(columns):
        if index > 0:
            compiled_query += ", "
        compiled_query += f"CAST({c} AS {data_type}) AS {c}"

    return compiled_query


def translate_convert(
    step: ConvertStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'CONVERT_STEP_{index}'

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step.columns: {step.columns}\n"
        f"step.data_type: {step.data_type}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.tables_metadata: {query.metadata_manager.tables_metadata}\n"
    )

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
                          f""" (SELECT {complete_fields(step.columns, query)} {format_cast_to_sql(step.columns, step.data_type)} FROM {query.query_name}) """,
        selection_query=build_selection_query(query.metadata_manager.tables_metadata, query_name),
        metadata_manager=query.metadata_manager,
    )

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
