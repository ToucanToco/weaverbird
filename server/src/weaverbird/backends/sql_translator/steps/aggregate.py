from weaverbird.backends.sql_translator.steps.utils.aggregation import (
    build_first_or_last_aggregation,
    prepare_aggregation_query,
)
from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLDialect,
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryExecutor,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import AggregateStep


def translate_aggregate(
    step: AggregateStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"AGGREGATE_STEP_{index}"

    aggregated_cols = []
    aggregated_string = ""
    first_last_string = ""

    query, aggregated_string, new_as_columns = prepare_aggregation_query(
        query_name, aggregated_cols, aggregated_string, query, step
    )

    query, query_string = build_first_or_last_aggregation(
        aggregated_string, first_last_string, query, step, query_name, new_as_columns
    )

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"{query.transformed_query}, {query_name} AS ({query_string})",
    )

    new_query.metadata_manager = query.metadata_manager
    new_query.selection_query = build_selection_query(
        query.metadata_manager.retrieve_query_metadata_columns(), query_name
    )

    return new_query
