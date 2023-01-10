from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import TopStep


def execute_top(
    step: TopStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    ascending = step.sort == "asc"
    if step.groups:
        return (
            df.groupby(step.groups)
            .apply(lambda df: df.sort_values(step.rank_on, ascending=ascending).head(step.limit))
            .reset_index(drop=True)
        )
    else:
        return df.sort_values(step.rank_on, ascending=ascending).head(step.limit)
