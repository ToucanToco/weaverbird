from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep


class TableStep(BaseStep):
    name = Field('table', const=True)
    domain: str
