from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import UnpivotStep


def execute_unpivot(
    step: UnpivotStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    df_melted = df.melt(
        id_vars=step.keep,
        value_vars=step.unpivot,
        var_name=step.unpivot_column_name,
        value_name=step.value_column_name,
    )
    return df_melted.dropna(subset=[step.value_column_name]) if step.dropna else df_melted
