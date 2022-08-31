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
from weaverbird.pipeline.steps import DurationStep


def translate_duration(
    step: DurationStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"DURATION_STEP_{index}"

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step: {step}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )
    # we complete fields
    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str(
        columns_filter=[step.new_column_name]
    )

    if sql_dialect == "postgres":
        interval_date = (
            f" EXTRACT({step.duration_in} FROM ({step.end_date_column}-{step.start_date_column}))"
        )
    # Unlike mentionned in Snowflake's documentation using '-' between timestamps is not working
    # https://snowflakecommunity.force.com/s/question/0D50Z00008EL41GSAT/sql-question-to-subtract-timestamps
    # so we must do a different case for Snowflake duration's computation
    else:
        interval_date = (
            f" DATEDIFF({step.duration_in},"
            f" to_timestamp({step.start_date_column}), to_timestamp({step.end_date_column}))"
        )

    # the final query
    final_query = (
        f"SELECT {completed_fields},"
        f"{interval_date} AS {step.new_column_name}"
        f" FROM {query.query_name}"
    )

    # we add the new column and the type
    query.metadata_manager.add_query_metadata_column(step.new_column_name, "FLOAT")

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS ({final_query})""",
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
