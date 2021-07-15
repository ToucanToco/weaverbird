from weaverbird.pipeline.steps import FilterStep

from server.weaverbird.backends.pipeline_translator.steps.utils.query_transformation import apply_condition
from server.weaverbird.backends.pipeline_translator import QueryRetriever, PipelineTranslator


def translate_filter(
    step: FilterStep,
    query: str,
    query_retriever: QueryRetriever = None,
    translate_pipeline: PipelineTranslator = None,
) -> str:

    return apply_condition(step.condition, query)
