from distutils import log

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
from weaverbird.pipeline.steps import TopStep


def translate_top(
    step: TopStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"TOP_STEP_{index}"

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step: {step}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )

    # fields to complete the query
    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str()

    if len(step.groups) > 0:
        order_on_groupby = " ASC, ".join(step.groups)
        if len(step.groups) > 0:
            order_on_groupby += " ASC"

        final_query = (
            f"SELECT * FROM (SELECT * FROM {query.query_name} QUALIFY ROW_NUMBER() "
            f"OVER (PARTITION BY {', '.join(step.groups)} ORDER BY {step.rank_on} {step.sort}) <= {step.limit}) "
            f"{query_name}_ALIAS ORDER BY {order_on_groupby}"
        )
    else:
        final_query = (
            f"SELECT {completed_fields} FROM {query.query_name} ORDER BY {step.rank_on}"
            f" {step.sort} LIMIT {step.limit}"
        )

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"{query.transformed_query}, {query_name} AS ({final_query})",
        selection_query=build_selection_query(
            query.metadata_manager.retrieve_query_metadata_columns(), query_name
        ),
        metadata_manager=query.metadata_manager,
    )

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
