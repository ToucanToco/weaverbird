from typing import Dict

from pydantic.main import BaseModel

from weaverbird.pipeline.types import PopulatedWithFieldnames


class BaseStep(BaseModel):
    name: str

    class Config(PopulatedWithFieldnames):
        extra = 'forbid'

    # None values are excluded, to avoid triggering validations error in front-ends
    def dict(self, *, exclude_none: bool = True, **kwargs) -> Dict:
        return super().dict(exclude_none=True, **kwargs)
