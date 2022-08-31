from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep


class TableStep(BaseStep):
    name: Literal["domain"] = "domain"
    domain: str
