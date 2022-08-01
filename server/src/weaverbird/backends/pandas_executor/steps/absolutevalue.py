from pandas import DataFrame

from weaverbird.backends.pandas_executor.registry import register
from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import AbsoluteValueStep


@register
def execute_absolutevalue(
    step: AbsoluteValueStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    return df.assign(**{step.new_column: df[step.column].abs()})
