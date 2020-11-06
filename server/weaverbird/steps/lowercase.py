from pandas import DataFrame
from pydantic import Field

from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor


class LowercaseStep(BaseStep):
    name = Field('lowercase', const=True)
    column: ColumnName

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        return df.assign(**{self.column: df[self.column].str.lower()})
