from collections.abc import Callable
from typing import Any

from .base import BaseStep


class StepWithVariablesMixin:
    def render(self, variables: dict[str, Any], renderer: Callable[[Any, Any], Any]) -> BaseStep:
        rendered_class = self.__class__.__bases__[0]
        step_as_dict = self.model_dump()  # type: ignore
        rendered_dict = renderer(step_as_dict, variables)
        return rendered_class(**rendered_dict)
