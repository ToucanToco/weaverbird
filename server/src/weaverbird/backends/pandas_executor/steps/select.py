from pandas import DataFrame

from weaverbird.backends.pandas_executor.registry import register
from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import SelectStep


@register
def execute_select(
    step: SelectStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    return df[step.columns]
