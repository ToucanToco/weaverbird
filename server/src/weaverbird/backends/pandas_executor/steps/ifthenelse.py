import numpy as np
from pandas import DataFrame

from weaverbird.backends.pandas_executor.steps.utils.formula import NullSeries, eval_formula
from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps.ifthenelse import IfThenElse, IfthenelseStep

from .utils.condition import apply_condition


def _execute_ifthenelse(ifthenelse: IfThenElse, df: DataFrame, new_column) -> DataFrame:
    if isinstance(ifthenelse.else_value, IfThenElse):
        else_branch = _execute_ifthenelse(ifthenelse.else_value, df, new_column)[new_column]
    else:
        else_branch = eval_formula(df, str(ifthenelse.else_value))

    then_branch = eval_formula(df, str(ifthenelse.then))

    # If one of the branches is null, we cast it to the non-null type to avoid typing issues
    else_branch_is_null = isinstance(else_branch, NullSeries)
    then_branch_is_null = isinstance(then_branch, NullSeries)

    if else_branch_is_null and not then_branch_is_null:
        else_branch = else_branch.astype(then_branch.dtype)
    elif then_branch_is_null and not else_branch_is_null:
        then_branch = then_branch.astype(else_branch.dtype)

    return df.assign(**{new_column: np.where(apply_condition(ifthenelse.condition, df), then_branch, else_branch)})


def execute_ifthenelse(
    step: IfthenelseStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    return _execute_ifthenelse(step, df, step.new_column)
