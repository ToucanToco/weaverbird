from abc import ABC, abstractmethod

from pandas import DataFrame
from pydantic.main import BaseModel

from weaverbird.types import DomainRetriever, PipelineExecutor, PopulatedWithFieldnames


class BaseStep(BaseModel, ABC):
    name: str

    class Config(PopulatedWithFieldnames):
        extra = 'forbid'

    @abstractmethod
    def execute(
        self, df: DataFrame, domain_retriever: DomainRetriever, pipeline_executor: PipelineExecutor
    ) -> DataFrame:
        ...
