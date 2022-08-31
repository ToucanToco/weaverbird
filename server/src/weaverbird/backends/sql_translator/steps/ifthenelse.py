from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    apply_condition,
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
from weaverbird.pipeline.steps import IfthenelseStep
from weaverbird.pipeline.steps.ifthenelse import IfThenElse


def build_conditional_expression(step: IfthenelseStep):
    built_string = ""
    current_nested_step = step

    while hasattr(current_nested_step, "else_value") and isinstance(
        current_nested_step.else_value, IfThenElse
    ):
        built_string += (
            f"WHEN {apply_condition(current_nested_step.condition, '')} "
            f"THEN {current_nested_step.then} "
        )
        current_nested_step = current_nested_step.else_value

    built_string += (
        f"WHEN {apply_condition(current_nested_step.condition, '').replace(',)', ')')} "
        f"THEN {current_nested_step.then} ELSE {current_nested_step.else_value} "
        f"END"
    )
    return built_string.replace('"', "'")


def translate_ifthenelse(
    step: IfthenelseStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"IFTHENELSE_STEP_{index}"

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )

    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str(
        columns_filter=[step.new_column]
    )

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {completed_fields}, CASE {build_conditional_expression(step)} AS {step.new_column.upper()}"""
        f""" FROM {query.query_name})""",
    )

    query.metadata_manager.add_query_metadata_column(step.new_column, "str")

    new_query.selection_query = build_selection_query(
        query.metadata_manager.retrieve_query_metadata_columns(), query_name
    )
    new_query.metadata_manager = query.metadata_manager

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
