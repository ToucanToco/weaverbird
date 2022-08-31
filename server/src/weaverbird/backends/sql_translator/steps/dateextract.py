from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
    get_query_for_date_extract,
)
from weaverbird.backends.sql_translator.types import (
    SQLDialect,
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryExecutor,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import DateExtractStep


def translate_dateextract(
    step: DateExtractStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"DATEEXTRACT_STEP_{index}"

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step: {step}\n"
    )

    def new_column_name(d: str, idd: int) -> str:
        """
        A security method inside the translator to get a new column name base
        on the step.new_columns wetheir or not that is empty or full

        d : date info element
        idd: index of that date info in new columns array
        """
        return (
            (
                # if index is in step.new_columns
                step.new_columns[idd]
                if idd < len(step.new_columns)
                else f"{step.column}_{d.upper()}"
            )
            if len(step.new_columns) > 0
            else f"{step.column}_{d.upper()}"
        )

    to_extract_string: str = ", ".join(
        [
            get_query_for_date_extract(d, step.column, new_column_name(d, idd))
            for idd, d in enumerate(step.date_info)
            if query.metadata_manager.add_query_metadata_column(
                f"{new_column_name(d, idd)}", "date"
            )
        ]
    )

    select_fields = ""
    # added the new column
    for table in query.metadata_manager.tables:
        select_fields = ", ".join(query.metadata_manager.retrieve_columns_as_list(table))

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
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
