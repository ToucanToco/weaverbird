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


def recursively_convert_nested_condition(step: IfthenelseStep, composed_query: str, sql_dialect: SQLDialect) -> str:
    if not hasattr(step, 'else_value'):
        return str(step)

    condition = apply_condition(step.condition, composed_query)
    expr1 = step.then

    if type(step.else_value) != IfThenElse:
        expr2 = step.else_value
        return build_conditional_expression(sql_dialect, condition, expr1, expr2)
    else:
        expr2 = recursively_convert_nested_condition(
            step.else_value, composed_query, sql_dialect
        )
        composed_query += build_conditional_expression(
            sql_dialect, condition, expr1, expr2
        )

    return composed_query.replace(',),', '),')


def build_conditional_expression(sql_dialect: SQLDialect, condition, expr1, expr2):
    if sql_dialect == "postgres":
        conditional_expression = f" CASE WHEN {condition} THEN {expr1} ELSE {expr2} END"
    else:
        conditional_expression = f" IFF({condition}, {expr1}, {expr2})"
    return conditional_expression


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
    query_name = f'IFTHENELSE_STEP_{index}'

    log.debug(
        '############################################################'
        f'query_name: {query_name}\n'
        '------------------------------------------------------------'
        f'query.transformed_query: {query.transformed_query}\n'
        f'query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n'
    )

    composed_query: str = ''
    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str(
        columns_filter=[step.new_column]
    )

    composed_query = (
        f"""{recursively_convert_nested_condition(step, composed_query, sql_dialect).replace('"', "'")}"""
        f""" AS {step.new_column.upper()}"""
    )
    if completed_fields:
        composed_query = f', {composed_query}'

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {completed_fields}{composed_query}"""
        f""" FROM {query.query_name})""",
    )

    query.metadata_manager.add_query_metadata_column(step.new_column, 'str')

    new_query.selection_query = build_selection_query(
        query.metadata_manager.retrieve_query_metadata_columns(), query_name
    )
    new_query.metadata_manager = query.metadata_manager

    log.debug(
        '------------------------------------------------------------'
        f'SQLquery: {new_query.transformed_query}'
        '############################################################'
    )

    return new_query
