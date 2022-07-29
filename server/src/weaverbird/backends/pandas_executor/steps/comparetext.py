from pandas import DataFrame

from weaverbird.backends.pandas_executor.registry import register
from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import CompareTextStep


@register
def execute_comparetext(
    step: CompareTextStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    return df.assign(**{step.new_column_name: df[step.str_col_1] == df[step.str_col_2]})
