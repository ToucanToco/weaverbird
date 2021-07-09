from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep


class DomainStep(BaseStep):
    name = Field('domain', const=True)
    domain: str
