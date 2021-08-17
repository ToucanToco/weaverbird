from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import TextStep


def complete_fields(query: SQLQuery) -> str:
    """
    We're going to complete missing field from the query
    """
    fields: list = []
    compiled_query: str = ""
    for table in [*query.metadata_manager.tables_metadata]:
        # TODO : changes the management columns on joins with duplicated columns
        for elt in query.metadata_manager.tables_metadata[table].keys():
            compiled_query += f'{elt}, ' if elt not in fields else ''

    return compiled_query


def translate_text(
    step: TextStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'TEXT_STEP_{index}'
    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step.text: {step.text}\n"
        f"step.new_column: {step.new_column}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.tables_metadata: {query.metadata_manager.tables_metadata}\n"
    )
    transformed_query = (
        f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {complete_fields(query)}'{step.text}' AS "{step.new_column}" """
        f"""FROM {query.query_name}) """
    )

    for table in [*query.metadata_manager.tables_metadata]:
        query.metadata_manager.add_column(table, step.new_column, "str")

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=transformed_query,
        selection_query=build_selection_query(query.metadata_manager.tables_metadata, query_name),
        metadata_manager=query.metadata_manager,
    )

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
