from abc import ABC, abstractmethod
from typing import Union

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

    def dict(
        self,
        *,
        include: Union['AbstractSetIntStr', 'MappingIntStrAny'] = None,
        exclude: Union['AbstractSetIntStr', 'MappingIntStrAny'] = None,
        by_alias: bool = False,
        skip_defaults: bool = None,
        exclude_unset: bool = False,
        exclude_defaults: bool = False,
        exclude_none: bool = True,
    ) -> 'DictStrAny':
        return super().dict(include=include,
                            exclude=exclude,
                            by_alias=by_alias,
                            skip_defaults=skip_defaults,
                            exclude_unset=exclude_unset,
                            exclude_defaults=exclude_defaults,
                            exclude_none=exclude_none)
