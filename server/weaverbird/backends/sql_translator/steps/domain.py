from weaverbird.backends.sql_translator.types import PipelineTranslator, QueryRetriever
from weaverbird.pipeline.steps import DomainStep


def translate_domain(
    step: DomainStep,
    query: str,
    query_retriever: QueryRetriever,
    translate_pipeline: PipelineTranslator = None,
) -> str:
    return query_retriever(step.domain)
