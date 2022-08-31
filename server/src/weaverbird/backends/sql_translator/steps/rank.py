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
from weaverbird.pipeline.steps import RankStep


def translate_rank(
    step: RankStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"RANK_STEP_{index}"

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step: {step}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )

    rank_mode = "DENSE_RANK()" if step.method == "dense" else "RANK()"
    step.new_column_name = (
        f"{step.value_col}_RANK" if step.new_column_name is None else step.new_column_name
    )

    # the rank query
    rank_query: str = ""
    order_by_query: str = ""
    if len(step.groupby) > 0:
        rank_query = (
            f", ({rank_mode} OVER (PARTITION BY {', '.join(step.groupby)} "
            f"ORDER BY {step.value_col} {step.order})) AS {step.new_column_name}"
        )

        order_on_groupby = " ASC, ".join(step.groupby)
        if len(step.groupby) > 0:
            order_on_groupby += " ASC"

        order_by_query = f"ORDER BY {step.new_column_name} ASC, {order_on_groupby}"
    else:
        rank_query = (
            f", ({rank_mode} OVER ("
            f"ORDER BY {step.value_col} {step.order})) AS {step.new_column_name}"
        )
        order_by_query = f"ORDER BY {step.new_column_name} ASC"

    final_query = (
        f" (SELECT {query.metadata_manager.retrieve_query_metadata_columns_as_str()}"
        f"{rank_query}"
        f" FROM {query.query_name} {order_by_query})"
    )

    # we add the column to the metadata
    query.metadata_manager.add_query_metadata_column(step.new_column_name, "int")

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"{query.transformed_query}, {query_name} AS {final_query}",
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
