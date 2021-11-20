from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import PercentageStep


def execute_percentage(
    step: PercentageStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    new_column_name = step.new_column_name or f'{step.column}_PCT'

    if len(step.group) > 0:
        sums = df.groupby(step.group, dropna=False)[step.column].transform('sum')
    else:
        sums = df[step.column].sum()
    return df.assign(**{new_column_name: df[step.column] / sums})
