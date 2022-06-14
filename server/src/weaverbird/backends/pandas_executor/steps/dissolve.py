from typing import Any, Dict, List

from pandas import DataFrame

from weaverbird.backends.pandas_executor.geo_utils import df_to_geodf
from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps.aggregate import Aggregation
from weaverbird.pipeline.steps.dissolve import DissolveStep

_AGG_FUNC_ALIASES = {
    'avg': 'mean',
    'count distinct': 'nunique',
    'count distinct including empty': len,
}


def _translate_agg_func(aggregations: List[Aggregation]) -> Dict[str, Any]:
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

    return DataFrame(
        df_to_geodf(df).dissolve(
            by=step.groups,
            aggfunc=_translate_agg_func(step.aggregations),
            as_index=False,
            dropna=not step.include_nulls,
        )
    )
