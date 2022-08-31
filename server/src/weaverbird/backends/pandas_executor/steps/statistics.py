from collections.abc import Callable

import numpy as np
from pandas import DataFrame, Series

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps.statistics import DUMB_GROUPBY_COLUMN_NAME, StatisticsStep


def statistic_to_pandas_method(s: str) -> str | Callable[[Series], float]:
    if s == "average":
        return "mean"
    elif s == "variance":
        return lambda x: x.var(ddof=0)
    elif s == "standard deviation":
        return lambda x: x.std(ddof=0)
    return s


def percentile(nth, order):
    def f(serie):
        return np.percentile(serie, nth / order * 100)

    return f


def execute_statistics(
    step: StatisticsStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    groupby_columns = step.groupby_columns
    if not step.groupby_columns:
        # Just create a temporary dumb column with '1' everywhere
        # so we can group by this column:
        groupby_columns = [DUMB_GROUPBY_COLUMN_NAME]
        df = df.assign(**{DUMB_GROUPBY_COLUMN_NAME: 1})

    stat_funcs = [statistic_to_pandas_method(s) for s in step.statistics]
    stat_funcs += [percentile(q.nth, q.order) for q in step.quantiles]
    result = df.groupby(groupby_columns)[step.column].agg(stat_funcs).reset_index()

    # Now, just fix the column names:
    quantile_names = [q.label or f"{q.nth}-th {q.order}-quantile" for q in step.quantiles]
    column_names = groupby_columns + step.statistics + quantile_names  # type: ignore
    result.columns = column_names

    if not step.groupby_columns:
        # Remove the temporary column:
        del result[DUMB_GROUPBY_COLUMN_NAME]

    return result
