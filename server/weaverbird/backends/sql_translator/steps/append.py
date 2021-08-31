from distutils import log

from weaverbird.backends.sql_translator.steps.utils.combination import (
    resolve_sql_pipeline_for_combination,
)
from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import AppendStep


def translate_append(
    step: AppendStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever,
    sql_query_describer: SQLQueryDescriber,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'APPEND_STEP_{index}'
    log.debug(
        '############################################################'
        f'query_name: {query_name}\n'
        '------------------------------------------------------------'
        f'step: {step}\n'
        f'query.transformed_query: {query.transformed_query}\n'
        f'query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n'
    )
    queries_to_append = {}
    query_to_union_metadata = {}

    transformed_query = f'{query.transformed_query}'
    for index, pipeline in enumerate(step.pipelines):
        query_string = resolve_sql_pipeline_for_combination(
            pipeline, sql_query_retriever, sql_translate_pipeline, sql_query_describer
        )
        unioned_query_name = f'APPEND_STEP_UNION_{index}'
        queries_to_append[unioned_query_name] = query_string
        query_to_union_metadata[unioned_query_name] = sql_query_describer(
            domain=None, query_string=query_string
        )

        query.metadata_manager.create_table(unioned_query_name)
        query.metadata_manager.add_table_columns_from_dict(
            unioned_query_name, query_to_union_metadata
        )
        transformed_query += f', {unioned_query_name} AS ({query_string})'

    # Metadata need to be updated only for additional "NULL" columns, these column will have first the first available
    # name from the immediate query below current one with excess column number (same behavior as Pandas)
    query.metadata_manager.append_queries_metadata(unioned_tables=[queries_to_append.keys()])

    # transformed_query = f'{query.transformed_query}, {right_query_name} AS ({right_query})'

    # # 5 build the final query string
    # join_part = f"{'AND'.join([f'{query.query_name}.{keys[0]} = {right_query_name}.{keys[1]}' for keys in step.on])}"
    # transformed_query = f"""{transformed_query}, {query_name} AS (SELECT {query.metadata_manager.retrieve_query_metadata_columns_as_str()} FROM {query.query_name} {how} JOIN {right_query_name} ON {join_part})"""

    log.debug(
        '------------------------------------------------------------'
        f'SQLquery: {transformed_query}'
        '############################################################'
    )

    return SQLQuery(
        query_name=query_name,
        transformed_query=transformed_query,
        selection_query=build_selection_query(
            query.metadata_manager.retrieve_query_metadata_columns(), query_name
        ),
        metadata_manager=query.metadata_manager,
    )
