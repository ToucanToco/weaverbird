from typing import Union

from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLTableRetriever,
)
from weaverbird.pipeline.steps import TableStep


def translate_table(
    step: TableStep,
    query: SQLQuery,
    index: int,
    sql_table_retriever: SQLTableRetriever,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> Union[str, SQLQuery]:
    """As it is always the first step add the with keyword"""
    table_name = sql_table_retriever(
        step.domain
    )  # TODO in laputa, implement the table retrieval instead of query

    sql_query = SQLQuery(
        current_query_name=f'select_step_{index}',
        transformed_query=f'with select_step_{index} as ({table_name}),',
        selection_query=f'select * from {f"select_step_{index}"}',
    )
    # TODO adapt Laputa to directly return the SQLQuery
    return sql_query
