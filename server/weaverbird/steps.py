from abc import ABC, abstractmethod
from typing import Callable, Union

import pandas as pd
from pydantic import BaseModel, Field

DomainRetriever = Callable[[str], pd.DataFrame]


class BaseStep(BaseModel, ABC):
    name: str

    @abstractmethod
    def execute(self, df: pd.DataFrame, domain_retriever: DomainRetriever) -> pd.DataFrame:
        ...


class DomainStep(BaseStep):
    name = Field('domain', const=True)
    domain: str

    def execute(self, _df, domain_retriever: DomainRetriever) -> pd.DataFrame:
        return domain_retriever(self.domain)


PipelineStep = Union[DomainStep]
