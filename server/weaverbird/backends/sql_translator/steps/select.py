from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import SelectStep


def translate_select(
    step: SelectStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'KEEPCOLS_STEP_{index}'
    keepcols_query = f"SELECT {', '.join(step.columns)} FROM {query.query_name}"

    cols_to_remove = {}
    for table in query.metadata_manager.tables_metadata.keys():
        cols_to_remove[table] = [
            col for col in query.metadata_manager.tables_metadata[table] if col not in step.columns
        ]
    for table in cols_to_remove.keys():
        [query.metadata_manager.remove_column(table, c) for c in cols_to_remove[table]]

    return SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS ({
            keepcols_query
        })""",
        selection_query=build_selection_query(query.metadata_manager.tables_metadata, query_name),
        metadata_manager=query.metadata_manager,
    )
