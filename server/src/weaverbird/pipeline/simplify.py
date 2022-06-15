from pandas import DataFrame

from server.src.weaverbird.backends.pandas_executor.geo_utils import df_to_geodf
from server.src.weaverbird.pipeline.steps.simplify import SimplifyStep
from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor


def execute_simplify(
    step: SimplifyStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    return DataFrame(
        df_to_geodf(df).simplify(tolerance=step.tolerance, preserve_topology=not step.fast)
    )
