from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
    sanitize_input,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryExecutor,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import FillnaStep


def translate_fillna(
    step: FillnaStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
) -> SQLQuery:
    query_name = f'FILLNA_STEP_{index}'

    unchanged_colums = query.metadata_manager.retrieve_query_metadata_columns_as_str(
        columns_filter=step.columns
    )
    fill_value = f"'{sanitize_input(step.value)}'" if isinstance(step.value, str) else step.value
    filled_columns = ', '.join([f'IFNULL({col}, {fill_value}) AS {col}' for col in step.columns])
    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS (SELECT {unchanged_colums}, {filled_columns}\
 FROM {query.query_name})""",
        selection_query=build_selection_query(
            query.metadata_manager.retrieve_query_metadata_columns(), query_name
        ),
        metadata_manager=query.metadata_manager,
    )
    return new_query