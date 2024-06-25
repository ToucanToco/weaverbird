import numpy as np
from pandas import DataFrame, DateOffset, to_datetime

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.exceptions import DuplicateError
from weaverbird.pipeline.steps import EvolutionStep

OFFSETS = {
    "vsLastYear": DateOffset(years=1),
    "vsLastMonth": DateOffset(months=1),
    "vsLastWeek": DateOffset(weeks=1),
    "vsLastDay": DateOffset(days=1),
}

_PREV_DATE_COL_SUFFIX = "_prev_date"


def execute_evolution(
    step: EvolutionStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    new_column = step.new_column or f"{step.value_col}_EVOL_{step.evolution_format.upper()}"
    df = df.reset_index(drop=True)
    # Ensure we do have a datetime series rather than object (that would be the case for
    # datetime.date instances)
    df[step.date_col] = to_datetime(df[step.date_col])

    id_cols = [step.date_col] + step.index_columns
    if df.set_index(id_cols).index.duplicated().any():
        raise DuplicateError("Multiple rows for the same date. Did you forget indexColumns?")

    # keeping only the groups, the date and the value columns in the offseted dataframe
    df_offseted = df[id_cols + [step.value_col]]
    date_col_offseted = df[step.date_col] + OFFSETS[step.evolution_type]
    df_offseted = df_offseted.assign(**{step.date_col: date_col_offseted})
    both = df.merge(df_offseted, on=id_cols, how="left", suffixes=(None, _PREV_DATE_COL_SUFFIX))
    prev_date_col = step.value_col + _PREV_DATE_COL_SUFFIX
    value_date, value_prev_date = both[step.value_col], both[prev_date_col]

    if step.evolution_format == "abs":
        evolution = value_date - value_prev_date
    else:
        evolution = ((value_date - value_prev_date) / value_prev_date.abs()).replace(np.inf, None)

    return both.assign(**{new_column: evolution}).drop(columns=[prev_date_col])
