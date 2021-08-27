from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SqlQueryMetadataManager,
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
) -> SQLQuery:
    """As it is always the first step add the with keyword"""
    select_from_table = sql_query_retriever(
        step.domain
    )  # TODO in laputa, implement the table retrieval instead of query
    query_name = f'SELECT_STEP_{index}'
    query_description = sql_query_describer(step.domain)
    query_metadata_manager = SqlQueryMetadataManager(
        tables_metadata={step.domain: query_description}
    )

    sql_query = SQLQuery(
        query_name=query_name,
        transformed_query=f'WITH {query_name} AS ({select_from_table})',
        selection_query=build_selection_query(
            query_metadata_manager.retrieve_query_metadata_columns(), query_name
        ),
        metadata_manager=query_metadata_manager,
    )
    # TODO adapt Laputa to directly return the SQLQuery
    return sql_query
