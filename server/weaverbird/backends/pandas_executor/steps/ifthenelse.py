from typing import Any

import numpy as np
from pandas import DataFrame

from weaverbird.backends.pandas_executor.steps.utils.formula import clean_formula, eval_formula
from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps.ifthenelse import IfThenElse, IfthenelseStep

from .utils.condition import apply_condition


# ifthenelse can take as a parameter either a formula, or a value
def clean_if_formula(formula_or_value: Any) -> Any:
    if isinstance(formula_or_value, str):
        return clean_formula(formula_or_value)
    else:
        return formula_or_value


def _execute_ifthenelse(ifthenelse: IfThenElse, df: DataFrame, new_column) -> DataFrame:
    if isinstance(ifthenelse.else_value, IfThenElse):
        else_branch = _execute_ifthenelse(ifthenelse.else_value, df, new_column)[new_column]
    else:
        else_branch = eval_formula(df, clean_if_formula(ifthenelse.else_value))

    then_branch = eval_formula(df, clean_if_formula(ifthenelse.then))

    return df.assign(
        **{
            new_column: np.where(
                apply_condition(ifthenelse.condition, df), then_branch, else_branch
            )
        }
    )


def execute_ifthenelse(
    step: IfthenelseStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    return _execute_ifthenelse(step, df, step.new_column)
