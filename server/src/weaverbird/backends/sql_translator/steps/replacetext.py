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
from weaverbird.pipeline.steps import ReplaceTextStep


def translate_replacetext(
    step: ReplaceTextStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever | None = None,
    sql_query_describer: SQLQueryDescriber | None = None,
    sql_query_executor: SQLQueryExecutor | None = None,
    sql_translate_pipeline: SQLPipelineTranslator | None = None,
    subcall_from_other_pipeline_count: int | None = None,
    sql_dialect: SQLDialect | None = None,
) -> SQLQuery:
    query_name = f"REPLACE_STEP_{index}"

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step.name: {step.name}\n"
        f"step.search_column: {step.search_column}\n"
        f"step.old_str: {step.old_str}\n"
        f"step.new_str: {step.new_str}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )

    def _clean_str(value):
        if not isinstance(value, float) and not isinstance(value, int):
            value = value.strip('"').strip("'").replace('"', "'").replace("'", "\\'")
            return f"'{value}'"
        return value

    compiled_query: str = (
        f"CASE WHEN {step.search_column}={_clean_str(step.old_str)} "
        f"THEN {_clean_str(step.new_str)} "
        f"ELSE {step.search_column} END AS {step.search_column}"
    )

    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str(
        columns_filter=[step.search_column]
    )

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=(
            f"{query.transformed_query}, {query_name} AS "
            f"(SELECT {completed_fields}, {compiled_query} FROM {query.query_name})"
        ),
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
