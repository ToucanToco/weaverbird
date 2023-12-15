from typing import Literal

from pydantic import field_validator

from weaverbird.pipeline.steps.utils.base import BaseStep


class SimplifyStep(BaseStep):
    name: Literal["simplify"] = "simplify"
    # All parts of the simplified geometry will be no more than this distance from the original
    tolerance: float = 1.0

    @field_validator("tolerance")
    @classmethod
    def _tolerance_validator(cls, value: float) -> float:
        assert value > 0, "tolerance must be strictly positive"
        return value
