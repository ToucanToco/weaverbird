from weaverbird.pipeline.steps import DomainStep

from server.weaverbird.backends.pipeline_translator import QueryRetriever, PipelineTranslator


def translate_domain(
    step: DomainStep,
    query: str,
    query_retriever: QueryRetriever,
    translate_pipeline: PipelineTranslator = None,
) -> str:
    return query_retriever(step.domain)
