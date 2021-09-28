from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryExecutor,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import ConvertStep


def translate_convert(
    step: ConvertStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
) -> SQLQuery:
    query_name = f'CONVERT_STEP_{index}'

    log.debug(
        '############################################################'
        f'query_name: {query_name}\n'
        '------------------------------------------------------------'
        f'step.columns: {step.columns}\n'
        f'step.data_type: {step.data_type}\n'
        f'query.transformed_query: {query.transformed_query}\n'
        f'query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n'
    )

    to_cast = []
    for col in step.columns:
        retrieved_col_type = query.metadata_manager.retrieve_query_metadata_column_type_by_name(
            column_name=col
        )
        if (
            retrieved_col_type == 'FLOAT' or retrieved_col_type == 'REAL'
        ) and step.data_type == 'integer':
            to_cast.append(f'TRUNCATE({col}) AS {col}')
        elif retrieved_col_type == 'TEXT' and step.data_type == 'integer':
            to_cast.append(f"CAST(SPLIT_PART({col}, '.', 0) AS {step.data_type}) AS {col}")
        elif (
            retrieved_col_type == 'TIMESTAMP_NTZ' or retrieved_col_type == 'DATE'
        ) and step.data_type == 'integer':
            to_cast.append(
                f"CAST(DATE_PART('EPOCH_MILLISECOND', TO_TIMESTAMP({col})) AS {step.data_type}) AS {col}"
            )
        else:
            to_cast.append(f'CAST({col} AS {step.data_type}) AS {col}')

    for c in step.columns:
        query.metadata_manager.update_query_metadata_column_type(c, step.data_type)

    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str(
        columns_filter=step.columns
    )

    compiled_query = ', '.join(to_cast)
    if len(completed_fields):
        compiled_query = f', {compiled_query}'
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
        '------------------------------------------------------------'
        f'SQLquery: {new_query.transformed_query}'
        '############################################################'
    )

    return new_query
