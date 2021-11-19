from pandas import DataFrame

from weaverbird.backends.pandas_executor.steps.utils.combination import (
    resolve_pipeline_for_combination,
)
from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import AppendStep


def execute_append(
    step: AppendStep,
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
        for pipeline in step.pipelines
    ]
    return df.append(other_dfs, ignore_index=True)
