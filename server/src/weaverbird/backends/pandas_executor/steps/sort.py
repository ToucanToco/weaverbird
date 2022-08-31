from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import SortStep


def execute_sort(
    step: SortStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    return df.sort_values(
        by=[sort.column for sort in step.columns],
        ascending=[sort.order == "asc" for sort in step.columns],
    )
