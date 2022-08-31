from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLDialect,
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryExecutor,
    SqlQueryMetadataManager,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import TableStep


def translate_table(
    step: TableStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    """As it is always the first step add the with keyword"""
    select_from_table = sql_query_retriever(
        step.domain
    )  # TODO in laputa, implement the table retrieval instead of query
    if len(select_from_table.split()) == 1:
        select_from_table = f"SELECT * FROM {select_from_table}"
    query_name = f"SELECT_STEP_{index}"
    query_name += (
        f"_{subcall_from_other_pipeline_count}"
        if isinstance(subcall_from_other_pipeline_count, int)
        and subcall_from_other_pipeline_count >= 0
        else ""
    )
    query_description = sql_query_describer(step.domain)
    query_metadata_manager = SqlQueryMetadataManager(
        tables_metadata={step.domain: query_description}
    )

    sql_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"WITH {query_name} AS ({select_from_table})",
        selection_query=build_selection_query(
            query_metadata_manager.retrieve_query_metadata_columns(), query_name
        ),
        metadata_manager=query_metadata_manager,
    )
    # TODO adapt Laputa to directly return the SQLQuery
    return sql_query
