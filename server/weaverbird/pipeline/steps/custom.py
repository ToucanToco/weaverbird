from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep


class CustomStep(BaseStep):
    name = Field('customsql', const=True)
    query: str
