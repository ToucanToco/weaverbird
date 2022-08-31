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
from weaverbird.pipeline.steps import PercentageStep


def translate_percentage(
    step: PercentageStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"PERCENTAGE_STEP_{index}"

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step: {step}\n"
    )

    group_query = (
        (f' GROUP BY {", ".join(step.group + [step.column])}' if len(step.group) > 0 else "")
        if step.group is not None
        else ""
    )

    select_fields = ""
    # added the new column
    for table in query.metadata_manager.tables:
        select_fields = (
            (
                ", ".join(step.group + [step.column])
                if len(step.group) > 0
                else ", ".join(query.metadata_manager.retrieve_columns_as_list(table))
            )
            if step.group is not None
            else ", ".join(query.metadata_manager.retrieve_columns_as_list(table))
        )

    for table in query.metadata_manager.tables:
        query.metadata_manager.add_table_column(table, step.new_column_name, "float")

        if step.group is not None and len(step.group) > 0:
            for col in query.metadata_manager.retrieve_columns_as_list(table):
                if col not in (step.group + [step.column, step.new_column_name]):
                    query.metadata_manager.remove_query_metadata_column(col)

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {select_fields},"""
        f""" RATIO_TO_REPORT({step.column}) OVER () AS {step.new_column_name}"""
        f""" FROM {query.query_name}{group_query})""",
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
