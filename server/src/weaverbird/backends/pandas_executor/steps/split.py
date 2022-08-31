from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import SplitStep


def execute_split(
    step: SplitStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    all_new_col = {}
    new_serie = df[step.column].str.split(step.delimiter)
    for i in range(step.number_cols_to_keep):
        all_new_col[f"{step.column}_{i + 1}"] = new_serie.str[i]
    return df.assign(**all_new_col)
