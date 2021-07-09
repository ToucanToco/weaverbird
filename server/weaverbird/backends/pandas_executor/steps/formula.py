from pandas import DataFrame

from weaverbird.backends.pandas_executor.steps.utils.formula import clean_formula, eval_formula
from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import FormulaStep


def execute_formula(
    step: FormulaStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    serie = eval_formula(df, clean_formula(step.formula))
    return df.assign(**{step.new_column: serie})
