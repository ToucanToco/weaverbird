from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import RankStep


def execute_rank(
    step: RankStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    new_column_name = step.new_column_name or f'{step.value_col}_RANK'
    rank_method = 'min' if step.method == 'standard' else step.method
    ascending = step.order == 'asc'
    if step.groupby:
        serie = df.groupby(step.groupby, dropna=False)[step.value_col]
    else:
        serie = df[step.value_col]
    rank_serie = serie.rank(method=rank_method, ascending=ascending)
    return df.assign(**{new_column_name: rank_serie}).sort_values(new_column_name)
