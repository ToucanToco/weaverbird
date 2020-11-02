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
        for pipeline in self.pipelines:
            other_df = execute_pipeline(pipeline)
            df = df.append(other_df, ignore_index=True)
        return df
