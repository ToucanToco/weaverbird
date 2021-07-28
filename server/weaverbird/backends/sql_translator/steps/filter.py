from weaverbird.backends.sql_translator.steps.utils.query_transformation import apply_condition
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import FilterStep


def translate_filter(
    step: FilterStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    new_query = SQLQuery(
        query_name=f'FILTER_STEP_{index}',
        transformed_query=f"""{query.transformed_query}, FILTER_STEP_{index} AS ({
        apply_condition(
            step.condition,
            f'''SELECT * FROM {query.query_name} WHERE '''
        )})""",
        selection_query=f"""SELECT * FROM {f'FILTER_STEP_{index}'}""",
    )
    return new_query
