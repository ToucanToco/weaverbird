from typing import Union

from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import TableStep


def translate_table(
    step: TableStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever,
    sql_query_describer: SQLQueryDescriber,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> Union[str, SQLQuery]:
    """As it is always the first step add the with keyword"""
    select_from_table = sql_query_retriever(
        step.domain
    )  # TODO in laputa, implement the table retrieval instead of query

    sql_query = SQLQuery(
        query_name=f'SELECT_STEP_{index}',
        transformed_query=f'WITH SELECT_STEP_{index} AS ({select_from_table})',
        selection_query=f'SELECT * FROM {f"SELECT_STEP_{index}"}',
        columns=sql_query_describer(step.domain),
    )
    # TODO adapt Laputa to directly return the SQLQuery
    return sql_query
