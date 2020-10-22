from typing import Union

from pydantic import BaseModel, Field


class BaseStep(BaseModel):
    name: str


class DomainStep(BaseStep):
    name = Field('domain', const=True)
    domain: str


PipelineStep = Union[DomainStep]
