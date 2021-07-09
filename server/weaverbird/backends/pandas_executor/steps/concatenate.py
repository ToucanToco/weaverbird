from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import ConcatenateStep


def execute_concatenate(
    step: ConcatenateStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    new_col = df[step.columns[0]].astype(str)
    for col_name in step.columns[1:]:
        new_col = new_col.str.cat(df[col_name].astype(str), sep=step.separator)
    return df.assign(**{step.new_column_name: new_col})
