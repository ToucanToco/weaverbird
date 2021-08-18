from distutils import log
from typing import List

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
from weaverbird.pipeline.steps import ConvertStep


def format_cast_to_sql(columns: List, data_type: str, completed_fields: str) -> (str, str):
    """
    From cast to sql
    """
    compiled_query: str = ""
    for c in columns:
        compiled_query = ", ".join([f"CAST({c} AS {data_type}) AS {c.upper()}" for c in columns])
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
        f"query.metadata_manager.query_metadata: {query.metadata_manager.query_metadata}\n"
    )

    for c in step.columns:
        query.metadata_manager.change_type(column_name=c, new_type=step.data_type)
    completed_fields = complete_fields(columns=step.columns, query=query)
    compiled_query = format_cast_to_sql(
        step.columns, step.data_type, completed_fields=completed_fields
    )
    if len(completed_fields):
        compiled_query = f', {compiled_query}'
    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {completed_fields}{compiled_query}"""
        f""" FROM {query.query_name}) """,
        selection_query=build_selection_query(query.metadata_manager.query_metadata, query_name),
        metadata_manager=query.metadata_manager,
    )

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
