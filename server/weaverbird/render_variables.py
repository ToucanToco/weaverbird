import json
from typing import Any, Dict

from jinja2 import Template

from weaverbird.steps.base import BaseStep


def render_dict_with_variables(d: dict, variables: Dict[str, Any]) -> dict:
    dict_as_json = json.dumps(d)
    rendered = Template(dict_as_json).render(**variables)
    return json.loads(rendered)


class StepWithVariablesMixin:
    def render(self, variables: Dict[str, Any]) -> BaseStep:
        RenderedClass = self.__class__.__bases__[0]
        step_as_dict = self.dict()  # type: ignore
        rendered_dict = render_dict_with_variables(step_as_dict, variables)
        return RenderedClass(**rendered_dict)
