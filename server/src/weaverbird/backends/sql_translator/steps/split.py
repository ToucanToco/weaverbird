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
from weaverbird.pipeline.steps import SplitStep


def translate_split(
    step: SplitStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"SPLIT_STEP_{index}"

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step: {step}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )

    # at least one col to keep
    step.number_cols_to_keep = (
        1
        if step.number_cols_to_keep is None or step.number_cols_to_keep == 0
        else step.number_cols_to_keep
    )

    # we should escape weird quotes on the delimiter
    # to prevent the sql query fail
    step.delimiter = step.delimiter.replace('"', "'").replace("'", "\\'")

    # We complete fields
    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str()

    # We construct the split query here
    # using SPLIT_PART
    split_query = ", ".join(
        [
            f"SPLIT_PART({step.column}, '{step.delimiter}', {delimiter_count + 1}) AS {step.column}_{delimiter_count + 1}"
            for delimiter_count in range(0, step.number_cols_to_keep)
        ]
    )
    # We add the metadata column
    [
        query.metadata_manager.add_query_metadata_column(
            f"{step.column}_{delimiter_count + 1}", "text"
        )
        for delimiter_count in range(0, step.number_cols_to_keep)
    ]

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {completed_fields}, {split_query}"""
        f""" FROM {query.query_name})""",
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
