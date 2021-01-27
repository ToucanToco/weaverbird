import pandas as pd
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor


class SplitStep(BaseStep):
    name = Field('split', const=True)
    column: ColumnName
    delimiter: str
    # at least one col to keep
    number_cols_to_keep: int = Field(gt=0)

    def execute(
        self,
        df: pd.DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> pd.DataFrame:
        all_new_col = {}
        new_serie = df[self.column].str.split(self.delimiter)
        for i in range(self.number_cols_to_keep):
            all_new_col[f'{self.column}_{i + 1}'] = new_serie.str[i]
        return df.assign(**all_new_col)


class SplitStepWithVariable(SplitStep, StepWithVariablesMixin):
    ...
