from pandas import DataFrame

from weaverbird.backends.pandas_executor.registry import register
from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import UppercaseStep


@register
def execute_uppercase(
    step: UppercaseStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    return df.assign(**{step.column: df[step.column].str.upper()})
