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
from weaverbird.pipeline.steps import ConvertStep

PG_BOOLEAN_VALUES = ",".join(
    [f"'{el}'" for el in ["t", "true", "y", "yes", "on", "1", "f", "false", "n", "no", "off", "0"]]
)


def build_psql(retrieved_col_type, data_type, col):
    if retrieved_col_type == "TEXT" and data_type == "boolean":
        return f"CASE WHEN {col} IN ({PG_BOOLEAN_VALUES}) THEN CAST({col} AS {data_type}) ELSE FALSE END AS {col}"
    if retrieved_col_type == "TEXT" and data_type == "integer":
        # To ensure we have a unified behavior between pandas, Snowflake & Postgres,
        # additional logic is required to
        # 1. replace any non-numeric valid string by ''
        # 2. Keep the part between '.' (1 is equivalent to 0 in split part
        # see https://docs.snowflake.com/en/sql-reference/functions/split_part.html#arguments)
        # 3. Nullify the output if 1 or 2 results in empty strings i e non numeric value
        # 4. Cast the resulting NULL or string representation of integer as Integer
        return (
            f"CAST(NULLIF(SPLIT_PART(REGEXP_REPLACE({col}, '[^0-9.]*', ''), '.', 1), '') "
            f"AS {data_type}) AS {col}"
        )
    if retrieved_col_type == "FLOAT" and data_type == "integer":
        return f"TRUNC({col}) AS {col}"

    return f"CAST({col} AS {data_type}) AS {col}"


def build_snowflake(retrieved_col_type, data_type, col):
    if (retrieved_col_type == "FLOAT" or retrieved_col_type == "REAL") and data_type == "integer":
        return f"TRUNCATE({col}) AS {col}"
    elif retrieved_col_type == "TEXT" and data_type == "integer":
        return f"CAST(SPLIT_PART({col}, '.', 0) AS {data_type}) AS {col}"
    elif (
        retrieved_col_type == "TIMESTAMP_NTZ" or retrieved_col_type == "DATE"
    ) and data_type == "integer":
        return f"CAST(DATE_PART('EPOCH_MILLISECOND', TO_TIMESTAMP({col})) AS {data_type}) AS {col}"
    return f"CAST({col} AS {data_type}) AS {col}"


def translate_convert(
    step: ConvertStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"CONVERT_STEP_{index}"

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step.columns: {step.columns}\n"
        f"step.data_type: {step.data_type}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )

    is_postgres = sql_dialect == "postgres"

    to_cast = []
    for col in step.columns:
        retrieved_col_type = query.metadata_manager.retrieve_query_metadata_column_type_by_name(
            column_name=col
        )

        if is_postgres:
            to_cast.append(build_psql(retrieved_col_type, step.data_type, col))
        else:
            to_cast.append(build_snowflake(retrieved_col_type, step.data_type, col))

    for c in step.columns:
        query.metadata_manager.update_query_metadata_column_type(c, step.data_type)

    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str(
        columns_filter=step.columns
    )

    compiled_query = ", ".join(to_cast)
    if len(completed_fields):
        compiled_query = f", {compiled_query}"
    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {completed_fields}{compiled_query}"""
        f""" FROM {query.query_name})""",
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
