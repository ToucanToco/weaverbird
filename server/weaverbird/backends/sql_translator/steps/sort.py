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
from weaverbird.pipeline.steps import SortStep
from weaverbird.pipeline.steps.sort import ColumnSort


def complete_fields(query: SQLQuery) -> str:
    """
    We're going to complete missing field from the query

    """
    compiled_query: str = ""
    for table in [*query.metadata_manager.tables_metadata]:
        # TODO : changes the management columns on joins with duplicated columns
        for index, elt in enumerate(query.metadata_manager.tables_metadata[table].keys()):
            if index > 0:
                compiled_query += ", "
            compiled_query += f'{elt}'

    return compiled_query


def sort_columns_to_sql(columns: List[ColumnSort]) -> str:
    """
    Concatenate fields and order's fields

    params:
    columns: List[ColumnSort]
    """
    compiled_query: str = ""
    for index, c in enumerate(columns):
        if index > 0:
            compiled_query += ", "
        compiled_query += f"{c.column} {c.order}"

    return compiled_query


def translate_sort(
    step: SortStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'SORT_STEP_{index}'

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step.columns: {step.columns}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.tables_metadata: {query.metadata_manager.tables_metadata}\n"
    )

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {complete_fields(query)} FROM {query.query_name} ORDER BY {sort_columns_to_sql(step.columns)}) """,
        selection_query=build_selection_query(query.metadata_manager.tables_metadata, query_name),
        metadata_manager=query.metadata_manager,
    )

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
