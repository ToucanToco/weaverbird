from typing import List, Union

from pandas import DataFrame
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName, TemplatedVariable

_TMP_GROUP_COL_NAME = '__TMP_COL_NAME'


class ArgminStep(BaseStep):
    name = Field('argmin', const=True)
    column: ColumnName
    groups: List[str] = []

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        group = self.groups

        if len(self.groups) == 0:
            # if no groups, we create a temp column with a constant in it. Grouping on it should yield a single result
            df[_TMP_GROUP_COL_NAME] = 1
            group = [_TMP_GROUP_COL_NAME]

        aggregated_df = df.groupby(group, as_index=False, dropna=False).agg({self.column: 'min'})

        if len(self.groups) == 0:
            # we now remove the ugly temp column that we grouped on
            del df[_TMP_GROUP_COL_NAME]
            del aggregated_df[_TMP_GROUP_COL_NAME]

        return df.merge(aggregated_df, on=[self.column] + self.groups)


class ArgminStepWithVariable(ArgminStep, StepWithVariablesMixin):
    groups: Union[TemplatedVariable, List[TemplatedVariable]]
