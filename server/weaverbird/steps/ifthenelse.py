from typing import Any

import numpy
from pandas import DataFrame
from pydantic import Field

from weaverbird.conditions import Condition
from weaverbird.formula import clean_formula
from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor


class IfthenelseStep(BaseStep):
    new_column: ColumnName = Field(alias='newColumn')
    condition: Condition = Field(alias='if')
    then: Any
    else_value: Any = Field(alias='else')

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:

        return df.assign(
            **{
                self.new_column: numpy.where(
                    self.condition.filter(df),
                    df.eval(clean_if_formula(self.then)),
                    df.eval(clean_if_formula(self.else_value)),
                )
            }
        )


# ifthenelse can take as a parameter either a formula, or a value
def clean_if_formula(formula_or_value: Any) -> Any:
    if isinstance(formula_or_value, str):
        return clean_formula(formula_or_value)
    else:
        return formula_or_value
