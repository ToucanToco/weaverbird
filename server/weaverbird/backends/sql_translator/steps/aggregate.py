from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_first_or_last_aggregation,
    prepare_aggregation_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
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

    return SQLQuery(
        query_name=f'AGGREGATE_STEP_{index}',
        selection_query=f"""SELECT * FROM {f'AGGREGATE_STEP_{index}'}""",
        transformed_query=f'{query.transformed_query}, AGGREGATE_STEP_{index} AS ({query_string})',
    )
