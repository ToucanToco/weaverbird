from typing import Literal, Union

from pydantic import BaseModel, Field

from weaverbird.pipeline.steps.utils.base import BaseStep


class Reference(BaseModel):
    type: Literal['ref']
    uid: str


class DomainStep(BaseStep):
    name = Field('domain', const=True)
    domain: Union[str, Reference]
