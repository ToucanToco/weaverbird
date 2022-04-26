from geopandas import GeoDataFrame
from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps.dissolve import AggregateFn, DissolveStep


class UnsupportedGeoOperation(Exception):
    def __init__(self, msg: str) -> None:
        super().__init__(f"Unsupported Geo operation: {msg}")


_COUNT_DISCTINCT_INCLUDING_EMPTY = 'count distinct including empty'

_AGG_FUNC_ALIASES = {
    'avg': 'mean',
    'count distinct': 'nunique',
    _COUNT_DISCTINCT_INCLUDING_EMPTY: 'nunique',
}


def _translate_agg_func(fn: AggregateFn) -> str:
    if fn in _AGG_FUNC_ALIASES:
        return _AGG_FUNC_ALIASES[fn]
    return fn


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
        aggfunc=_translate_agg_func(step.agg_function),
        as_index=False,
        # If we want to count empty values, we need to keep NAs
        dropna=step.agg_function != _COUNT_DISCTINCT_INCLUDING_EMPTY,
    )
