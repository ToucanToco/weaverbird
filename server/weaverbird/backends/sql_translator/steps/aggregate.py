from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_first_or_last_aggregation,
    build_selection_query,
    prepare_aggregation_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SqlQueryMetadataManager,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import AggregateStep


def translate_aggregate(
    step: AggregateStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    aggregated_cols = []
    aggregated_string = ''
    first_last_string = ''
    aggregated_string = prepare_aggregation_query(aggregated_cols, aggregated_string, query, step)
    query_string = build_first_or_last_aggregation(
        aggregated_string, first_last_string, query, step
    )
    query_name = f'AGGREGATE_STEP_{index}'
    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f'{query.transformed_query}, {query_name} AS ({query_string})',
    )
    tables_metadata = {
        [*query.metadata_manager.tables_metadata][0]: sql_query_describer(
            domain=[*query.metadata_manager.tables_metadata][0],
            query_string=f'{new_query.transformed_query} SELECT * FROM {query_name}',
        )
    }
    new_query.metadata_manager = SqlQueryMetadataManager(tables_metadata=tables_metadata)
    new_query.selection_query = build_selection_query(tables_metadata, query_name)

    return new_query
