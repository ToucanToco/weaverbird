from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep


class CustomStep(BaseStep):
    name: Literal["custom"] = "custom"
    query: str
