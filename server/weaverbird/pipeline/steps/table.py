from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep


class TableStep(BaseStep):
    name = Field('domain', const=True)
    domain: str
