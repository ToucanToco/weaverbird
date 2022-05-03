from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep


class CustomStep(BaseStep):
    name = Field('custom', const=True)
    query: str
