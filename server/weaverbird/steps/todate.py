from typing import Optional

from pandas import DataFrame, to_datetime
from pydantic import Field

from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor


class ToDateStep(BaseStep):
    name = Field('todate', const=True)
    column: ColumnName
    format: Optional[str]

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        datetime_serie = to_datetime(df[self.column], format=self.format, errors='coerce')
        return df.assign(**{self.column: datetime_serie})
