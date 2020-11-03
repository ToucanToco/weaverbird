from typing import List

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps.base import BaseStep
from weaverbird.types import PipelineExecutor

Pipeline = List[dict]


class AppendStep(BaseStep):
    name = Field('append', const=True)
    pipelines: List[Pipeline]

    def execute(
        self,
        df: DataFrame,
        domain_retriever,
        execute_pipeline: PipelineExecutor,
    ) -> DataFrame:
        other_dfs = [execute_pipeline(pipeline) for pipeline in self.pipelines]
        return df.append(other_dfs, ignore_index=True)
