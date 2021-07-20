from weaverbird.backends.sql_translator.types import SQLPipelineTranslator, SQLQueryRetriever
from weaverbird.pipeline.steps import DomainStep


def translate_domain(
    step: DomainStep,
    query: str,
    sql_query_retriever: SQLQueryRetriever,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> str:
    return sql_query_retriever(step.domain)
