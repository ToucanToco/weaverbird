from pandas import DataFrame

from weaverbird.backends.pandas_executor.steps.utils.formula import (
    build_formula_tree,
    translate_formula,
)
from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import FormulaStep


def execute_formula(
    step: FormulaStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    formula_str = translate_formula(step.formula)
    serie = build_formula_tree(df, formula_str)
    return df.assign(**{step.new_column: serie})
