from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_hierarchical_columns_list,
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
from weaverbird.pipeline.steps import RollupStep


def translate_rollup(
    step: RollupStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:

    query_name = f"ROLLUP_STEP_{index}"
    all_columns = build_hierarchical_columns_list(step)
    group_by_part = f"GROUP BY {', '.join(step.groupby)}, " if step.groupby else "GROUP BY "
    rollup_part = f"ROLLUP({', '.join(step.hierarchy)}) HAVING {step.hierarchy[0]} IS NOT NULL"
    transformed_query = f"""{query.transformed_query}, {query_name} AS (SELECT {all_columns} FROM {query.query_name} {group_by_part}{rollup_part})"""
    query.metadata_manager.remove_query_metadata_all_columns()
    query.metadata_manager.add_query_metadata_columns(
        sql_query_describer(
            domain=None, query_string=f"{transformed_query} SELECT * FROM {query_name}"
        )
    )
    return SQLQuery(
        query_name=query_name,
        transformed_query=transformed_query,
        selection_query=build_selection_query(
            query.metadata_manager.retrieve_query_metadata_columns(), query_name
        ),
        metadata_manager=query.metadata_manager,
    )
