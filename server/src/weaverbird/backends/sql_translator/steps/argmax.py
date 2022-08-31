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
from weaverbird.pipeline.steps import ArgmaxStep


def translate_argmax(
    step: ArgmaxStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"ARGMAX_STEP_{index}"

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step: {step}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )

    if len(step.groups):
        on_query = "ON " + " AND ".join(
            [f"A.{c}_ALIAS_A=B.{c}" for c in step.groups + [step.column]]
        )
        # the final query
        final_query = (
            f"SELECT * FROM (SELECT {', '.join([f'{c} AS {c}_ALIAS_A' for c in step.groups])},"
            f" MAX({step.column}) AS {step.column}_ALIAS_A FROM {query.query_name}"
            f" GROUP BY {', '.join([f'{c}_ALIAS_A' for c in step.groups])}) A"
            f" INNER JOIN {query.query_name} B"
            f" {on_query}"
        )
    else:
        final_query = (
            f"SELECT * FROM (SELECT MAX({step.column}) AS {step.column}_ALIAS_A FROM {query.query_name}) A"
            f" INNER JOIN {query.query_name} B"
            f" ON A.{step.column}_ALIAS_A=B.{step.column}"
        )
    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"{query.transformed_query}, {query_name} AS ({final_query})",
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
