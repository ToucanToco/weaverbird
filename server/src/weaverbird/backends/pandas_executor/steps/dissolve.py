from typing import Any

from pandas import DataFrame

from weaverbird.backends.pandas_executor.geo_utils import df_to_geodf
from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps.aggregate import Aggregation
from weaverbird.pipeline.steps.dissolve import DissolveStep

_AGG_FUNC_ALIASES = {
    "avg": "mean",
    "count distinct": "nunique",
    "count distinct including empty": len,
}


def _translate_agg_func(aggregations: list[Aggregation]) -> dict[str, Any]:
    return {
        agg.columns[0]: _AGG_FUNC_ALIASES[agg.agg_function]
        if agg.agg_function in _AGG_FUNC_ALIASES
        else agg.agg_function
        for agg in aggregations
    }


def execute_dissolve(
    step: DissolveStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    if len(step.aggregations) > 0:
        aggfunc: dict[str, Any] | str = _translate_agg_func(step.aggregations)
        geo_df = df_to_geodf(df)
    else:
        aggfunc = "first"  # placeholder, can't be None
        columns_to_keep = set(step.groups + ["geometry"])
        geo_df = df_to_geodf(df).drop(list(set(df.columns) - columns_to_keep), axis=1)

    return DataFrame(
        geo_df.dissolve(
            by=step.groups,
            aggfunc=aggfunc,
            as_index=False,
            dropna=not step.include_nulls,
        )
    )
