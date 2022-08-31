from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import TopStep


def execute_top(
    step: TopStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    pandas_method = "nlargest" if step.sort == "desc" else "nsmallest"
    if step.groups:
        return (
            df.groupby(step.groups)
            .apply(lambda df: getattr(df, pandas_method)(step.limit, step.rank_on))
            .reset_index(drop=True)
        )
    else:
        return getattr(df, pandas_method)(step.limit, step.rank_on)
