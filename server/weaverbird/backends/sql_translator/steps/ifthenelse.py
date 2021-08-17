from distutils import log
from typing import List

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    apply_condition,
    build_selection_query, complete_fields,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import IfthenelseStep
from weaverbird.pipeline.steps.ifthenelse import IfThenElse


def recursively_convert_nested_condition(step: IfthenelseStep, composed_query: str) -> str:

    if not hasattr(step, 'else_value'):
        return str(step)

    if type(step.else_value) != IfThenElse:
        return (
            f"""IFF({apply_condition(step.condition, composed_query)}, """
            f"""{step.then}, {step.else_value})"""
        )
    else:
        composed_query += (
            f"""IFF({apply_condition(step.condition, composed_query)}, {step.then}, """
            f"""{recursively_convert_nested_condition(step.else_value, composed_query)})"""
        )

    return composed_query.replace(",),", "),")


def translate_ifthenelse(
    step: IfthenelseStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'IFTHENELSE_STEP_{index}'

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.tables_metadata: {query.metadata_manager.tables_metadata}\n"
    )
    composed_query: str = ""
    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {complete_fields([step.new_column], query)} """
        f"""{recursively_convert_nested_condition(step, composed_query).replace('"', "'")}"""
        f""" AS {step.new_column}"""
        f""" FROM {query.query_name}) """,
    )

    for table in [*query.metadata_manager.tables_metadata]:
        query.metadata_manager.add_column(table, step.new_column, "str")

    new_query.selection_query = build_selection_query(
        query.metadata_manager.tables_metadata, query_name
    )
    new_query.metadata_manager = query.metadata_manager

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
