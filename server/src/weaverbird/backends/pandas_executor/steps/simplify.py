from pandas import DataFrame

from weaverbird.backends.pandas_executor.geo_utils import df_to_geodf
from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import SimplifyStep


def execute_simplify(
    step: SimplifyStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    geo_df = df_to_geodf(df)
    # WARNING: potentially mutating
    # Simplify returns a GeoSeries, so we need to reassign here.
    #
    # Also, we don't want to provide preserve_topoly to the user, as results
    # are too imprecise (some result in empty polygons, see:
    # https://geopandas.org/en/stable/docs/reference/api/geopandas.GeoSeries.simplify.html)
    geo_df.geometry = geo_df.simplify(tolerance=step.tolerance, preserve_topology=True)
    return DataFrame(geo_df)
