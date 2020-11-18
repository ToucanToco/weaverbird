from typing import List, Union

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps.base import BaseStep
from weaverbird.types import DomainRetriever, PipelineExecutor


def resolve_pipeline(
    pipeline: Union[List[dict], str],
    domain_retriever: DomainRetriever,
    execute_pipeline: PipelineExecutor,
) -> DataFrame:
    """
    Combined pipelines can be either single domains (str), or complete pipeline (list of steps)
    """
    if isinstance(pipeline, str):
        return domain_retriever(pipeline)
    else:
        return execute_pipeline(pipeline)


class AppendStep(BaseStep):
    name = Field('append', const=True)
    pipelines: List[Union[List[dict], str]]

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever,
        execute_pipeline: PipelineExecutor,
    ) -> DataFrame:
        other_dfs = [
            resolve_pipeline(
                pipeline,
                domain_retriever,
                execute_pipeline,
            )
            for pipeline in self.pipelines
        ]
        return df.append(other_dfs, ignore_index=True)
