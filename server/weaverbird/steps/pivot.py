from typing import List, Literal, Union

from pandas import DataFrame
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps.base import BaseStep
from weaverbird.types import TemplatedVariable


class PivotStep(BaseStep):
    name = Field('pivot', const=True)
    index: List[str]
    column_to_pivot: str
    value_column: str
    agg_function: Literal['sum', 'avg', 'count', 'min', 'max']

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        pivoted_df = df.pivot_table(
            values=self.value_column,
            index=self.index,
            columns=self.column_to_pivot,
            aggfunc='mean' if self.agg_function == 'avg' else self.agg_function,
        ).reset_index()
        pivoted_df.columns.name = None
        return pivoted_df


class PivotStepWithVariable(PivotStep, StepWithVariablesMixin):
    index: Union[TemplatedVariable, List[TemplatedVariable]]
