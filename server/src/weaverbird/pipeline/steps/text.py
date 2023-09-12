from datetime import datetime
from typing import Literal
from zoneinfo import ZoneInfo

from pydantic import BaseConfig, Extra, field_validator

from weaverbird.pipeline.steps.utils.base import BaseStep, to_camelcase
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName


class TextStep(BaseStep):
    name: Literal["text"] = "text"
    text: datetime | int | float | bool | str
    new_column: ColumnName

    # TODO[pydantic]: The `Config` class inherits from another class, please create the `model_config` manually.
    # Check https://docs.pydantic.dev/dev-v2/migration/#changes-to-config for more information.
    class Config(BaseConfig):
        allow_population_by_field_name = True
        extra = Extra.forbid
        alias_generator = to_camelcase
        smart_union = True

    @field_validator("text")
    @classmethod
    def _text_validator(cls, value):
        if isinstance(value, datetime) and value.tzinfo is not None:
            return value.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)
        return value


class TextStepWithVariable(TextStep, StepWithVariablesMixin):
    ...
