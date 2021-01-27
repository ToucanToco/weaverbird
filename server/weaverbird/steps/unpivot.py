from typing import List, Union

from pandas import DataFrame
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor, TemplatedVariable


class UnpivotStep(BaseStep):
    name = Field('unpivot', const=True)
    keep: List[ColumnName]
    unpivot: List[ColumnName]
    unpivot_column_name: ColumnName
    value_column_name: ColumnName
    dropna: bool

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        df_melted = df.melt(
            id_vars=self.keep,
            value_vars=self.unpivot,
            var_name=self.unpivot_column_name,
            value_name=self.value_column_name,
        )
        return df_melted.dropna(subset=[self.value_column_name]) if self.dropna else df_melted


class UnpivotStepWithVariable(UnpivotStep, StepWithVariablesMixin):
    keep: Union[TemplatedVariable, List[TemplatedVariable]]
    unpivot: Union[TemplatedVariable, List[TemplatedVariable]]
