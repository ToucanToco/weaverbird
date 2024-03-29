from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps.utils.combination import PipelineOrDomainNameOrReference, Reference


def resolve_pipeline_for_combination(
    pipeline: PipelineOrDomainNameOrReference,
    domain_retriever: DomainRetriever,
    pipeline_executor: PipelineExecutor,
) -> DataFrame:
    """
    Combined pipelines can be either single domains (str), or complete pipeline (list of steps)
    """
    from weaverbird.pipeline import Pipeline

    if isinstance(pipeline, str) or isinstance(pipeline, Reference):
        return domain_retriever(pipeline)
    else:
        # NOTE execution report of the sub-pipeline is discarded
        return pipeline_executor(Pipeline(steps=pipeline), domain_retriever)[0]
