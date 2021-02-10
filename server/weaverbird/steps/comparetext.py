from pandas import DataFrame
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor, TemplatedVariable


class CompareTextStep(BaseStep):
    name: str = Field('comparetext', const=True)
    new_column_name: ColumnName = Field(alias='newColumnName')
    str_col_1: ColumnName = Field(alias='strCol1')
    str_col_2: ColumnName = Field(alias='strCol2')

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        return df.assign(**{self.new_column_name: df[self.str_col_1] == df[self.str_col_2]})


class CompareTextStepWithVariables(CompareTextStep, StepWithVariablesMixin):
    str_col_1: TemplatedVariable = Field(alias='strCol1')
    str_col_2: TemplatedVariable = Field(alias='strCol2')
