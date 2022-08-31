from pandas import DataFrame, DateOffset

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.exceptions import DuplicateError
from weaverbird.pipeline.steps import EvolutionStep

OFFSETS = {
    "vsLastYear": DateOffset(years=1),
    "vsLastMonth": DateOffset(months=1),
    "vsLastWeek": DateOffset(weeks=1),
    "vsLastDay": DateOffset(days=1),
}


def execute_evolution(
    step: EvolutionStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    new_column = step.new_column or f"{step.value_col}_EVOL_{step.evolution_format.upper()}"
    df = df.reset_index(drop=True)

    id_cols = [step.date_col] + step.index_columns
    if df.set_index(id_cols).index.duplicated().any():
        raise DuplicateError("Multiple rows for the same date. Did you forget indexColumns?")

    date_col_offseted = df[step.date_col] + OFFSETS[step.evolution_type]
    df_offseted = df.assign(**{step.date_col: date_col_offseted})
    both = df.merge(df_offseted, on=id_cols, how="left", suffixes=(None, "_prev_date"))
    value_date, value_prev_date = both[step.value_col], both[f"{step.value_col}_prev_date"]

    if step.evolution_format == "abs":
        evolution = value_date - value_prev_date
    elif step.evolution_format == "pct":
        evolution = value_date / value_prev_date - 1

    return df.assign(**{new_column: evolution})
