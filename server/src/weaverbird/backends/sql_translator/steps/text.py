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
from weaverbird.pipeline.steps import TextStep


def translate_text(
    step: TextStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"TEXT_STEP_{index}"
    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step.text: {step.text}\n"
        f"step.new_column: {step.new_column}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )

    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str()
    renamed_fields = f"""'{step.text}' AS {step.new_column} """
    if completed_fields:
        renamed_fields = f", {renamed_fields}"
    transformed_query = (
        f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {completed_fields}{renamed_fields}"""
        f"""FROM {query.query_name})"""
    )

    query.metadata_manager.add_query_metadata_column(step.new_column, "text")

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=transformed_query,
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
