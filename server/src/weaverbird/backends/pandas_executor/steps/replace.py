from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import ReplaceStep


def execute_replace(
    step: ReplaceStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    return df.assign(
        **{
            step.search_column: df[step.search_column].replace(
                {old_value: new_value for (old_value, new_value) in step.to_replace}
            )
        }
    )
