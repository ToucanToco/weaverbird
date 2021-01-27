from pandas import DataFrame
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName


class TextStep(BaseStep):
    name = Field('text', const=True)
    text: str
    new_column: ColumnName

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        return df.assign(**{self.new_column: self.text})


class TextStepWithVariable(TextStep, StepWithVariablesMixin):
    ...
