from typing import Any, Union

import numpy
from pandas import DataFrame
from pydantic import BaseModel, Field

from weaverbird.conditions import Condition
from weaverbird.formula import clean_formula, eval_formula
from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor, PopulatedWithFieldnames


class IfThenElse(BaseModel):
    class Config(PopulatedWithFieldnames):
        ...

    condition: Condition = Field(alias='if')
    then: Any
    else_value: Union['IfThenElse', Any] = Field(alias='else')

    def execute_ifthenelse(self, df, new_column):
        if isinstance(self.else_value, IfThenElse):
            else_branch = self.else_value.execute_ifthenelse(df, new_column)[new_column]
        else:
            else_branch = eval_formula(df, clean_if_formula(self.else_value))

        then_branch = eval_formula(df, clean_if_formula(self.then))

        return df.assign(
            **{new_column: numpy.where(self.condition.filter(df), then_branch, else_branch)}
        )


IfThenElse.update_forward_refs()


class IfthenelseStep(BaseStep, IfThenElse):
    class Config(PopulatedWithFieldnames):
        ...

    name = Field('ifthenelse', const=True)
    new_column: ColumnName = Field(alias='newColumn')

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        return self.execute_ifthenelse(df, self.new_column)


# ifthenelse can take as a parameter either a formula, or a value
def clean_if_formula(formula_or_value: Any) -> Any:
    if isinstance(formula_or_value, str):
        return clean_formula(formula_or_value)
    else:
        return formula_or_value


class IfThenElseStepWithVariables(IfthenelseStep, StepWithVariablesMixin):
    class Config(PopulatedWithFieldnames):
        ...
