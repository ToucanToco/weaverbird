from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryExecutor,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import CumSumStep


def translate_cumsum(
    step: CumSumStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
) -> SQLQuery:
    query_name = f'CUMSUM_STEP_{index}'

    log.debug(
        '############################################################'
        f'query_name: {query_name}\n'
        '------------------------------------------------------------'
        f'step: {step}\n'
        f'query.transformed_query: {query.transformed_query}\n'
        f'query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n'
    )

    # if any new column name had been provided
    if step.new_column is None:
        step.new_column = f"{step.value_column}_CUMSUM"

    # we complete fields without the new column name
    # if there is a same naming
    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str(
        columns_filter=[step.new_column]
    )

    # the partition by sub query
    partition_by_sub_query = 'NULL'
    # if there is a group by query
    if step.groupby is not None and len(step.groupby):
        partition_by_sub_query = ', '.join(step.groupby)

    # The final query
    final_query = (
        f"SELECT {completed_fields}, SUM({step.value_column}) OVER (PARTITION BY {partition_by_sub_query}"
        f" ORDER BY {step.reference_column} ASC rows UNBOUNDED PRECEDING) {step.new_column}"
        f" FROM {query.query_name} ORDER BY {step.reference_column} ASC"
    )

    # we make sure to add the new column in the metadata list
    query.metadata_manager.add_query_metadata_column(step.new_column, "FLOAT")

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS ({final_query})""",
        selection_query=build_selection_query(
            query.metadata_manager.retrieve_query_metadata_columns(), query_name
        ),
        metadata_manager=query.metadata_manager,
    )

    log.debug(
        '------------------------------------------------------------'
        f'SQLquery: {new_query.transformed_query}'
        '############################################################'
    )

    return new_query
