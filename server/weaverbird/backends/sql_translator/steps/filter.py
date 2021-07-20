from weaverbird.backends.sql_translator.steps.utils.query_transformation import apply_condition
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLTableRetriever,
)
from weaverbird.pipeline.steps import FilterStep


def translate_filter(
    step: FilterStep,
    query: SQLQuery,
    index: int,
    sql_table_retriever: SQLTableRetriever,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    new_query = SQLQuery(
        query_name=f'filter_step_{index}',
        transformed_query=f"""{query.transformed_query} filter_step_{index} as ({
                apply_condition(
                step.condition,
                f''''select * from {query.query_name}'''
                )
            }),""",
        selection_query=f"""select * from {f'select_step_{index}'}""",
    )

    return new_query
