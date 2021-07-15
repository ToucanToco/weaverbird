from weaverbird.backends.sql_translator.steps.utils.query_transformation import apply_condition
from weaverbird.backends.sql_translator.types import PipelineTranslator, QueryRetriever
from weaverbird.pipeline.steps import FilterStep


def translate_filter(
    step: FilterStep,
    query: str,
    query_retriever: QueryRetriever = None,
    translate_pipeline: PipelineTranslator = None,
) -> str:

    return apply_condition(step.condition, query)
