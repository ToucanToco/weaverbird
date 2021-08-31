from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
    get_query_for_date_extract,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import DateExtractStep


def translate_dateextract(
    step: DateExtractStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'DATEEXTRACT_STEP_{index}'

    log.debug(
        '############################################################'
        f'query_name: {query_name}\n'
        '------------------------------------------------------------'
        f'step: {step}\n'
    )

    to_extract_string: str = ""
    for index, d in enumerate(step.date_info):
        if index > 0:
            to_extract_string += ", "
        new_column = (
            (
                # if index is in step.new_columns
                step.new_columns[index]
                if index < len(step.new_columns)
                else f'{step.column}_{d.upper()}'
            )
            if len(step.new_columns) > 0
            else f'{step.column}_{d.upper()}'
        )
        to_extract_string += get_query_for_date_extract(d, step.column, new_column)
        query.metadata_manager.add_query_metadata_column(f"{new_column}", "date")

    select_fields = ""
    # added the new column
    for table in query.metadata_manager.tables:
        select_fields = ', '.join(query.metadata_manager.retrieve_columns_as_list(table))

    if len(select_fields) > 0:
        to_extract_string = ", " + to_extract_string

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {select_fields}{to_extract_string} FROM {query.query_name})""",
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
