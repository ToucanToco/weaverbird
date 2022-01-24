from typing import Union

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.combination import Reference


class DomainStep(BaseStep):
    name = Field('domain', const=True)
    domain: Union[str, Reference]
