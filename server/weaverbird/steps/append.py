from typing import List

from pandas import DataFrame
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps.base import BaseStep
from weaverbird.steps.combination import PipelineOrDomainName, resolve_pipeline_for_combination
from weaverbird.types import DomainRetriever, PipelineExecutor


class AppendStep(BaseStep):
    name = Field('append', const=True)
    pipelines: List[PipelineOrDomainName]

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever,
        execute_pipeline: PipelineExecutor,
    ) -> DataFrame:
        other_dfs = [
            resolve_pipeline_for_combination(
                pipeline,
                domain_retriever,
                execute_pipeline,
            )
            for pipeline in self.pipelines
        ]
        return df.append(other_dfs, ignore_index=True)


class AppendStepWithVariable(AppendStep, StepWithVariablesMixin):
    ...
