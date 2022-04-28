from typing import Dict, List

from geopandas import GeoDataFrame
from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps.dissolve import Aggregation, DissolveStep


class UnsupportedGeoOperation(Exception):
    def __init__(self, msg: str) -> None:
        super().__init__(f"Unsupported Geo operation: {msg}")


_AGG_FUNC_ALIASES = {
    'avg': 'mean',
    'count distinct': 'nunique',
}


def _translate_agg_func(aggregations: List[Aggregation]) -> Dict[str, str]:
    return {
        agg.column: _AGG_FUNC_ALIASES[agg.agg_function]
        if agg.agg_function in _AGG_FUNC_ALIASES
        else agg.agg_function
        for agg in aggregations
    }


def execute_dissolve(
    step: DissolveStep,
    df: GeoDataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    if not (isinstance(df, GeoDataFrame) and hasattr(df, 'geometry')):
        raise UnsupportedGeoOperation("df must be a GeoDataFrame and 'geometry' must be set")

    return df.dissolve(
        by=step.groups,
        aggfunc=_translate_agg_func(step.aggregations),
        as_index=False,
        dropna=not step.include_nulls,
    )
