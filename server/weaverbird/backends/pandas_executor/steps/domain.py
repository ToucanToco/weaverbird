from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import DomainStep


def execute_domain(
    step: DomainStep,
    df: DataFrame,
    domain_retriever: DomainRetriever,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    return domain_retriever(step.domain)
