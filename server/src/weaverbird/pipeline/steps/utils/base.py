from typing import Any

from pydantic import BaseModel as PydanticBaseModel
from pydantic import ConfigDict


def to_camelcase(string: str) -> str:
    first_word, *other_words = string.split("_")
    return first_word + "".join(word.capitalize() for word in other_words)


class BaseModel(PydanticBaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid", alias_generator=to_camelcase)


class BaseStep(BaseModel):
    name: str

    def model_dump(self, *, exclude_none: bool = True, **kwargs) -> dict[str, Any]:
        return super().model_dump(exclude_none=exclude_none, **kwargs)

    # None values are excluded, to avoid triggering validations error in front-ends
    def dict(self, *, exclude_none: bool = True, **kwargs) -> dict[str, Any]:
        return self.model_dump(exclude_none=exclude_none, **kwargs)
