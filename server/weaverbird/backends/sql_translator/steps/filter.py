from weaverbird.backends.sql_translator.steps.utils.query_transformation import apply_condition
from weaverbird.backends.sql_translator.types import SQLPipelineTranslator, SQLQueryRetriever
from weaverbird.pipeline.steps import FilterStep


def translate_filter(
    step: FilterStep,
    query: str,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> str:
    return apply_condition(step.condition, query)
