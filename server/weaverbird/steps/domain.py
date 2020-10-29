from pandas import DataFrame
from pydantic import Field

from weaverbird.steps.base import BaseStep
from weaverbird.types import DomainRetriever


class DomainStep(BaseStep):
    name = Field('domain', const=True)
    domain: str

    def execute(self, _df, domain_retriever: DomainRetriever, execute_pipeline=None) -> DataFrame:
        return domain_retriever(self.domain)
