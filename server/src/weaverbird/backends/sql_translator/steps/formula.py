from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
    handle_zero_division,
)
from weaverbird.backends.sql_translator.types import (
    SQLDialect,
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryExecutor,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import FormulaStep


def translate_formula(
    step: FormulaStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    """
    Supported operators are:
    - "+"
    - "-"
    - "*"
    - "/" -> To avoid
    - "%"
    See: https://docs.snowflake.com/en/sql-reference/operators-arithmetic.html
    """

    query_name = f"FORMULA_STEP_{index}"
    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step.formula: {step.formula}\n"
        f"step.new_column: {step.new_column}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )
    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str(
        columns_filter=[]
    )

    transformed_query = (
        f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {completed_fields}, {handle_zero_division(step.formula)} AS {step.new_column}"""
        f""" FROM {query.query_name})"""
    )
    # query.metadata_manager.add_column(column_name=step.new_column, column_type='float')
    query.metadata_manager.add_query_metadata_column(step.new_column, "float")

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=transformed_query,
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
