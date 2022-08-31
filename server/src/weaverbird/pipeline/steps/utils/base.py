from pydantic import BaseConfig, BaseModel, Extra


class BaseStep(BaseModel):
    name: str

    class Config(BaseConfig):
        allow_population_by_field_name = True
        extra = Extra.forbid

    # None values are excluded, to avoid triggering validations error in front-ends
    def dict(self, *, exclude_none: bool = True, **kwargs) -> dict:
        return super().dict(exclude_none=True, **kwargs)
