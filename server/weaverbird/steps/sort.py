from typing import List, Literal

from pandas import DataFrame
from pydantic import BaseModel, Field

from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor, PopulatedWithFieldnames


class ColumnSort(BaseModel):
    class Config(PopulatedWithFieldnames):
        ...

    column: ColumnName
    order: Literal['asc', 'desc']


class SortStep(BaseStep):
    name = Field('sort', const=True)
    columns: List[ColumnSort]

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        return df.sort_values(
            by=[sort.column for sort in self.columns],
            ascending=[sort.order == 'asc' for sort in self.columns],
        )
