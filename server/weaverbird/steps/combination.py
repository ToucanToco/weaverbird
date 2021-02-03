from typing import List, Union

from pandas import DataFrame

from weaverbird.steps.base import PipelineExecutor
from weaverbird.types import DomainRetriever

PipelineOrDomainName = Union[List[dict], str]  # can be either a domain name or a complete pipeline


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
        return pipeline_executor(Pipeline(steps=pipeline))
