from pandas import DataFrame, merge

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import JoinStep

from .utils.cleaning import rename_duplicated_columns
from .utils.combination import resolve_pipeline_for_combination


def execute_join(
    step: JoinStep,
    df: DataFrame,
    domain_retriever: DomainRetriever,
    execute_pipeline: PipelineExecutor,
) -> DataFrame:
    right_df = resolve_pipeline_for_combination(
        step.right_pipeline, domain_retriever, execute_pipeline
    )

    if step.type == "left outer":
        how = "outer"
    else:
        how = step.type

    result = merge(
        df,
        right_df,
        left_on=[o[0] for o in step.on],
        right_on=[o[1] for o in step.on],
        how=how,
        suffixes=("", "_JOIN"),
    )
    return rename_duplicated_columns(result)
