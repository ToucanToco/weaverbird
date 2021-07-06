from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import ArgmaxStep

_TMP_GROUP_COL_NAME = '__TMP_COL_NAME'


def execute_argmax(
    step: ArgmaxStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    group = step.groups

    if len(step.groups) == 0:
        # if no groups, we create a temp column with a constant in it.
        # Grouping on it should yield a single result
        df[_TMP_GROUP_COL_NAME] = 1
        group = [_TMP_GROUP_COL_NAME]

    aggregated_df = df.groupby(group, as_index=False, dropna=False).agg({step.column: 'max'})

    if len(step.groups) == 0:
        # we now remove the ugly temp column that we grouped on
        del df[_TMP_GROUP_COL_NAME]
        del aggregated_df[_TMP_GROUP_COL_NAME]

    return df.merge(aggregated_df, on=[step.column] + step.groups)
