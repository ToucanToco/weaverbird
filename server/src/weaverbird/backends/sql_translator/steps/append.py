from distutils import log

from weaverbird.backends.sql_translator.steps.utils.combination import (
    resolve_sql_pipeline_for_combination,
)
from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
    build_union_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLDialect,
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryExecutor,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import AppendStep


def translate_append(
    step: AppendStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"APPEND_STEP_{index}"
    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step: {step}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )
    queries_to_append = {}
    query_to_union_metadata = {}

    transformed_query = f"{query.transformed_query}"

    for index, pipeline in enumerate(step.pipelines):
        query_string = resolve_sql_pipeline_for_combination(
            pipeline_or_domain=pipeline,
            sql_query_retriever=sql_query_retriever,
            sql_translate_pipeline=sql_translate_pipeline,
            sql_query_describer=sql_query_describer,
            sql_query_executor=sql_query_executor,
            subcall_from_other_pipeline_count=index,
        )
        unioned_query_name = f"APPEND_STEP_UNION_{index}"
        queries_to_append[unioned_query_name] = query_string
        query_to_union_metadata[unioned_query_name] = sql_query_describer(
            domain=None, query_string=query_string
        )
        log.debug(
            "------------------------------------------------------------"
            f"SQLquery: {transformed_query}"
            "############################################################"
        )
        query.metadata_manager.create_table(unioned_query_name)
        query.metadata_manager.add_table_columns_from_dict(
            unioned_query_name, query_to_union_metadata[unioned_query_name]
        )
        transformed_query += f", {unioned_query_name} AS ({query_string})"

    query.metadata_manager.append_queries_metadata(unioned_tables=queries_to_append.keys())
    transformed_query += f", {query_name} AS\
 ({build_union_query(query.metadata_manager, query.query_name, queries_to_append.keys())})"
    query.metadata_manager.rename_union_columns()

    return SQLQuery(
        query_name=query_name,
        transformed_query=transformed_query,
        selection_query=build_selection_query(
            query.metadata_manager.retrieve_query_metadata_columns(), query_name
        ),
        metadata_manager=query.metadata_manager,
    )
