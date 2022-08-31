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
from weaverbird.pipeline.steps import SubstringStep


def translate_substring(
    step: SubstringStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"SUBSTRING_STEP_{index}"

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step: {step}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )

    step.new_column_name = (
        f"{step.column}_SUBSTR" if step.new_column_name is None else step.new_column_name
    )

    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str(
        columns_filter=[step.column] if step.column == step.new_column_name else []
    )

    # For negative values, since snowflake returns automatically an empty string,
    # That's means, the synthax down there :
    # SUBSTR(TOTO,  -7, -4)
    #
    # Is equivalent to :
    # SUBSTR(TOTO, (LENGTH(TOTO) - 7), (LENGTH(TOTO) - 4))
    step.start_index = (
        f"(LENGTH ({step.column}) {step.start_index})" if step.start_index < 0 else step.start_index
    )
    step.end_index = (
        f"(LENGTH ({step.column}) {step.end_index})" if step.end_index < 0 else step.end_index
    )

    # we add the metadata column
    query.metadata_manager.add_query_metadata_column(step.new_column_name, "text")

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {completed_fields}, SUBSTR({step.column}, {step.start_index}, {step.end_index}) """
        f"""AS {step.new_column_name} FROM {query.query_name})""",
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
