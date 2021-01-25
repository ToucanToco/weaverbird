from typing import List, Literal

from pandas import DataFrame
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor, TemplatedVariable


class TopStep(BaseStep):
    name = Field('top', const=True)
    groups: List[ColumnName] = []
    rank_on: ColumnName
    sort: Literal['asc', 'desc']
    limit: int

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        pandas_method = 'nlargest' if self.sort == 'desc' else 'nsmallest'
        if self.groups:
            return (
                df.groupby(self.groups)
                .apply(lambda df: getattr(df, pandas_method)(self.limit, self.rank_on))
                .reset_index(drop=True)
            )
        else:
            return getattr(df, pandas_method)(self.limit, self.rank_on)


class TopStepWithVariables(TopStep, StepWithVariablesMixin):
    sort: TemplatedVariable
    limit: TemplatedVariable
