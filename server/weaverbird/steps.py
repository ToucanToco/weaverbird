from abc import ABC, abstractmethod
from typing import Any, Callable, List, Literal, Union

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


ColumnName = Union[str, int, float]
DataValue = Union[bool, float, int, str, list, None]


class SimpleCondition(BaseModel):
    column: ColumnName
    # TODO support all operators
    operator: Literal['eq']
    value: DataValue


class FilterStep(BaseStep):
    name = Field('filter', const=True)
    # TODO support and/or nesting
    condition: SimpleCondition

    def execute(self, df: pd.DataFrame, domain_retriever) -> pd.DataFrame:
        return df[df[self.condition.column] == self.condition.value]


PipelineStep = Union[DomainStep, FilterStep]


class Pipeline(BaseModel):
    steps: List[PipelineStep]
