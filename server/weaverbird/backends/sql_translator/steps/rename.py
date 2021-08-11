from distutils import log
from typing import Dict, List

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import RenameStep


def complete_fields(new_fields: List[str], tables_metadata: Dict[str, Dict[str, str]]) -> str:
    """
    We're going to complete missing field from the query

    """
    compiled_query: str = ""
    for elt in tables_metadata['table1'].keys():
        if elt not in new_fields:
            compiled_query += f'{elt}, '

    return compiled_query


def translate_rename(
    step: RenameStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'RENAME_STEP_{index}'

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step.to_rename: {step.to_rename}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.tables_metadata: {query.metadata_manager.tables_metadata}\n"
    )

    fields = []
    for old, new in step.to_rename:
        table = [*query.metadata_manager.tables_metadata][0]
        query.metadata_manager.change_name(old, new, table)
        fields.append(new)

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {str(complete_fields(fields, query.metadata_manager.tables_metadata)) +
                                        ', '.join([f'{old} AS {new}' for old, new in step.to_rename])}"""
        f""" FROM {query.query_name})""",
        selection_query=build_selection_query(query.metadata_manager.tables_metadata, query_name),
        metadata_manager=query.metadata_manager,
    )

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
