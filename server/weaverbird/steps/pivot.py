from typing import List, Literal

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps.base import BaseStep


class PivotStep(BaseStep):
    name = Field('pivot', const=True)
    index: List[str]
    column_to_pivot: str
    value_column: str
    agg_function: Literal['sum', 'avg', 'count', 'min', 'max']

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        return df.pivot_table(
            values=self.value_column,
            index=self.index,
            columns=self.column_to_pivot,
            aggfunc='mean' if self.agg_function == 'avg' else self.agg_function,
        ).reset_index()
