from pydantic import BaseConfig, Extra
from pydantic import BaseModel as PydanticBaseModel


def to_camelcase(string: str) -> str:
    first_word, *other_words = string.split("_")
    return first_word + "".join(word.capitalize() for word in other_words)


class BaseModel(PydanticBaseModel):
    # TODO[pydantic]: The `Config` class inherits from another class, please create the `model_config` manually.
    # Check https://docs.pydantic.dev/dev-v2/migration/#changes-to-config for more information.
    class Config(BaseConfig):
        allow_population_by_field_name = True
        extra = Extra.forbid
        alias_generator = to_camelcase


class BaseStep(BaseModel):
    name: str

    # None values are excluded, to avoid triggering validations error in front-ends
    def dict(self, *, exclude_none: bool = True, **kwargs) -> dict:
        return super().dict(exclude_none=True, **kwargs)
