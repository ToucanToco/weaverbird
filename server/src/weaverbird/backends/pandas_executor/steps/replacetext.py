from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import ReplaceTextStep


def execute_replacetext(
    step: ReplaceTextStep,
    df: DataFrame,
    domain_retriever: DomainRetriever | None = None,
    execute_pipeline: PipelineExecutor | None = None,
) -> DataFrame:
    return df.assign(
        **{step.search_column: df[step.search_column].str.replace(step.old_str, step.new_str)}
    )
