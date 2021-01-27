from typing import Any, List

from pandas import DataFrame
from pydantic import Field, root_validator

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor


class FillnaStep(BaseStep):
    name = Field('fillna', const=True)
    columns: List[ColumnName] = Field(min_items=1)
    value: Any

    @root_validator(pre=True)
    def handle_legacy_syntax(cls, values):
        if 'column' in values:
            values['columns'] = [values.pop('column')]
        return values

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        return df.fillna({col_name: self.value for col_name in self.columns})


class FillnaStepWithVariable(FillnaStep, StepWithVariablesMixin):
    ...
