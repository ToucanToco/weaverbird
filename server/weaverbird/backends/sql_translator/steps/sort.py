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


def sort_columns_to_sql(columns: List[ColumnSort]) -> str:
    compiled_query: str = ""
    for index, c in enumerate(columns):
        if index > 0:
            compiled_query += " AND"
        compiled_query += f" {c.column} {c.order}"

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

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT * FROM {query.query_name} ORDER BY{sort_columns_to_sql(step.columns)})"""
        f""" FROM {query.query_name})""",
        selection_query=build_selection_query(query.metadata_manager.tables_metadata, query_name),
        metadata_manager=query.metadata_manager,
    )

    return new_query
