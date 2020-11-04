from pandas import DataFrame
from pydantic import Field
from weaverbird.steps import BaseStep
from weaverbird.types import DomainRetriever, PipelineExecutor, ColumnName


class FromdateStep(BaseStep):
    name = Field('fromdate', const=True)
    column: ColumnName
    format: str

    def execute(self, df: DataFrame, domain_retriever: DomainRetriever,
                execute_pipeline: PipelineExecutor) -> DataFrame:
        formatted_time = df[self.column].dt.strftime(self.format)
        return df.assign(**{self.column: formatted_time})
