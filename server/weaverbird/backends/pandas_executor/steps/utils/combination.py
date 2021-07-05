from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps.utils.combination import PipelineOrDomainName


def resolve_pipeline_for_combination(
    pipeline: PipelineOrDomainName,
    domain_retriever: DomainRetriever,
    pipeline_executor: PipelineExecutor,
) -> DataFrame:
    """
    Combined pipelines can be either single domains (str), or complete pipeline (list of steps)
    """
    from weaverbird.pipeline import Pipeline

    if isinstance(pipeline, str):
        return domain_retriever(pipeline)
    else:
        # NOTE execution report of the sub-pipeline is discarded
        return pipeline_executor(Pipeline(steps=pipeline), domain_retriever)[0]
