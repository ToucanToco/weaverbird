from typing import List, Literal, Union

from pydantic import BaseModel


class Reference(BaseModel):
    type: Literal['ref']
    uid: str


PipelineOrDomainName = Union[List[dict], str]  # can be either a domain name or a complete pipeline
PipelineOrDomainNameOrReference = Union[PipelineOrDomainName, Reference]
