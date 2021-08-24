from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.backends.sql_translator.steps.utils.combination import (
    resolve_sql_pipeline_for_combination,
)
from weaverbird.backends.sql_translator.steps.utils.query_transformation import build_join_query
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import JoinStep


def translate_join(
    step: JoinStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever,
    sql_query_describer: SQLQueryDescriber,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'JOIN_STEP_{index}'

    # Retrieve the right query either directly as a domain or as a resolved sql pipeline
    right_query = resolve_sql_pipeline_for_combination(
        step.right_pipeline, sql_query_retriever, sql_translate_pipeline
    )
    # Update tables metadata with joined table metadata

    # 1 add right metadata
    query_to_join_metadata = sql_query_describer(right_query)
    query.metadata_manager.add_table_metadata(
        'JOIN_STEP_{index}_RIGHT', {f'{k}_RIGHT': v for k, v in query_to_join_metadata.items}
    )

    # 2 build the query string
    transformed_query = f"""{query.transformed_query}, {
    build_join_query(
        query_metadata=query.metadata_manager.query_metadata,
        query_to_join_metadata=query_to_join_metadata,
        left_query_name=query.query_name,
        right_query_name=f'JOIN_STEP_{index}_RIGHT',
        right_query=right_query,
        step_index=index,
        left_on=[o[0] for o in step.on],
        right_on=[o[1] for o in step.on],
        how=step.type
    )}"""

    # 3 Suffix columns from left part of the join in metadata
    query.metadata_manager.suffix_columns('_LEFT')

    # 4 Update query metadata with all columns
    query.metadata_manager.add_columns(query_to_join__metadata)

    # 5 update the query object
    return SQLQuery(
        query_name=query_name,
        transformed_query=transformed_query,
        selection_query=build_selection_query(query.metadata_manager.tables_metadata, query_name),
        metadata_manager=query.metadata_manager,
    )
