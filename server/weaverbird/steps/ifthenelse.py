from typing import Any, Union

import numpy
from pandas import DataFrame
from pydantic import BaseModel, Field

from weaverbird.conditions import Condition
from weaverbird.formula import clean_formula
from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor


class IfThenElse(BaseModel):
    condition: Condition = Field(alias='if')
    then: str
    else_value: Union['IfThenElse', Any] = Field(alias='else')

    def execute(self, df, new_column):
        if isinstance(self.else_value, IfThenElse):
            else_branch = self.else_value.execute(df, new_column)[new_column]
        else:
            else_branch = df.eval(clean_if_formula(self.else_value))

        return df.assign(
            **{
                new_column: numpy.where(
                    self.condition.filter(df), df.eval(clean_if_formula(self.then)), else_branch
                )
            }
        )


IfThenElse.update_forward_refs()


class IfthenelseStep(BaseStep):
    name = Field('ifthenelse', const=True)
    new_column: ColumnName = Field(alias='newColumn')
    condition: Condition = Field(alias='if')
    then: Any
    else_value: Union[Any, IfThenElse] = Field(alias='else')

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        return IfThenElse(
            **{'if': self.condition, 'then': self.then, 'else': self.else_value}
        ).execute(df, self.new_column)


# ifthenelse can take as a parameter either a formula, or a value
def clean_if_formula(formula_or_value: Any) -> Any:
    if isinstance(formula_or_value, str):
        return clean_formula(formula_or_value)
    else:
        return formula_or_value
