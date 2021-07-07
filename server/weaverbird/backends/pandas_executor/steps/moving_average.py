from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import MovingAverageStep


def execute_moving_average(
    step: MovingAverageStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    new_column_name = step.new_column_name or f'{step.value_column}_MOVING_AVG'
    df = df.sort_values(by=step.groups + [step.column_to_sort]).reset_index(drop=True)
    if step.groups:
        df_grouped = df.groupby(step.groups, dropna=False)
    else:
        df_grouped = df
    serie = df_grouped.rolling(step.moving_window).mean()[step.value_column].reset_index(drop=True)
    return df.assign(**{new_column_name: serie})
